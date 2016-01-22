import logging
import os
import asyncio
import signal

import click
import aiopg
import jinja2
import aiohttp_jinja2
from aiohttp import web
from aiohttp_session import session_middleware
from aiohttp_session.cookie_storage import EncryptedCookieStorage
import aiohttp_cors

from .. import conf
import nwaddrbook.web
from ..web import handlers
from ..web import api
from ..auth import ldap

from ..wamp import ApplicationSession, ApplicationRunner


def my_add(x, y):
    return x + y


class MyComponent(ApplicationSession):
    def __init__(self, config=None, app_cfg=None, loop=None):
        ApplicationSession.__init__(self, config)

        self.loop = loop
        self.app_cfg = app_cfg
        self.webserver = WebServer(self, loop)

    async def onJoin(self, details):
        logging.info("Session joined.")

        logging.info('Start web server...')
        await self.webserver.start()

        # can do subscribes, registers here e.g.:
        # yield from self.subscribe(...)
        # yield from self.register(...)
        try:
            await self.register(my_add, u'ws.hoax.anoa.add')
            logging.info("Procedure registered.")
        except Exception as e:
            logging.warning("Could not register procedure: {0}".format(e))

    def onClose(self, wasClean):
        logging.info('exit clean: {0}'.format(wasClean))
        if not wasClean:
            self.loop.stop()
        logging.info('Stop web server...')
        self.loop.create_task(self.webserver.stop())


def get_static_path():
    module_path = os.path.dirname(os.path.abspath(nwaddrbook.web.__file__))
    return os.path.join(module_path, 'static')


class WebServer:
    def __init__(self, wamp, loop):
        self._srv = None
        self._handler = None
        self._loop = loop
        self.app = None
        self.wamp = wamp
        self.app_cfg = wamp.app_cfg

    async def start(self):
        # Fernet key must be 32 bytes.
        cookie_secret = self.app_cfg.webserver.cookie_secret.encode('utf-8')
        app = web.Application(middlewares=[session_middleware(
            EncryptedCookieStorage(cookie_secret))])
        self.app = app

        app.wamp = self.wamp

        def jinja_url_helper(route_name, *args, **kwargs):
            return app.router[route_name].url(*args, **kwargs)

        jinja_env = aiohttp_jinja2.setup(app, loader=jinja2.PackageLoader('nwaddrbook.web'))
        jinja_env.globals['url'] = jinja_url_helper

        cors = aiohttp_cors.setup(app)

        app.db = await aiopg.create_pool(**self.app_cfg.database.__dict__)

        app.auth = ldap.Provider(self.app_cfg.auth.ldap.url, self.app_cfg.auth.ldap.basedn, self._loop)
        app.api = api.Provider(app)

        app.router.add_route('GET', '/', handlers.index)
        app.router.add_route('*', '/login', handlers.login)
        app.router.add_route('GET', '/logout', handlers.logout)
        cors.add(
            app.router.add_route('POST', '/api', handlers.ajaxapi),
            {'*': aiohttp_cors.ResourceOptions(
                allow_credentials=True,
                expose_headers='*',
                allow_headers='*')
             })
        app.router.add_static('/', get_static_path(), name='static')

        self._handler = app.make_handler()
        self._srv = await self._loop.create_server(self._handler, self.app_cfg.webserver.listen, int(self.app_cfg.webserver.port))

    async def stop(self):
        await self._handler.finish_connections(1.0)
        self._srv.close()
        await self._srv.wait_closed()
        await self.app.finish()


@click.command()
@click.option('-c', '--config', 'config_path', type=click.Path(exists=True, readable=True, dir_okay=False), required=True)
def cli(config_path):
    app_cfg = conf.load(config_path)

    loop = asyncio.get_event_loop()
    try:
        loop.add_signal_handler(signal.SIGTERM, loop.stop)
    except NotImplementedError:
        # signals are not available on Windows
        pass

    logging.info('Init...')
    wamp_runner = ApplicationRunner(
        url=app_cfg.wamp.url,
        realm=app_cfg.wamp.realm,
        loop=loop
    )
    wamp_runner.run(MyComponent, app_cfg)

    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass
    finally:
        wamp_runner.stop()
        # дожидаемся завершения всех оставшихся задач и выходим.
        pending = asyncio.Task.all_tasks()
        loop.run_until_complete(asyncio.gather(*pending))
        loop.close()
