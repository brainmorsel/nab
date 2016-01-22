import json

from aiohttp import web
from aiohttp_session import get_session
from aiohttp_jinja2 import template

# Set default logging handler to avoid "No handler found" warnings.
import logging
import logging.config
try:  # Python 2.7+
    from logging import NullHandler
except ImportError:
    class NullHandler(logging.Handler):
        def emit(self, record):
            pass

logging.getLogger(__name__).addHandler(NullHandler())


@template('index.html')
async def index(request):
    return {}


@template('login.html')
async def login(request):
    session = await get_session(request)
    if 'username' in session:
        return {'username': session['username'], 'success': True}

    post = await request.post()
    if 'username' in post and 'password' in post:
        success = await request.app.auth.check_login(post['username'], post['password'])
        if success:
            session['username'] = post['username']
        return {'username': post['username'], 'success': success}

    return {}


async def logout(request):
    session = await get_session(request)
    session.invalidate()
    return web.HTTPFound('/login')


async def ajaxapi(request):
    result = {'success': False, 'error': 'Incorrect request.'}
    if request.method == 'POST' and request.content_type == 'application/json':
        data = await request.json()
        result = await request.app.api.request('user-id-1', data)
        logging.getLogger(__name__).debug('REQ {0}'.format(json.dumps(data)))
        # print('RES', json.dumps(result))
        return web.Response(text=json.dumps(result), content_type='application/json')
