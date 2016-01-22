from concurrent.futures import ThreadPoolExecutor

import ldap3


class Provider:
    def __init__(self, server_uri, base_dn, loop, max_workers=None):
        self._server = ldap3.Server(server_uri)
        self._base_dn = base_dn
        self._loop = loop
        self._executor = ThreadPoolExecutor(max_workers)

    def _sync_check_login(self, uid, password):
        user_dn = None

        with ldap3.Connection(self._server) as c:
            c.search(self._base_dn, '(uid={0})'.format(uid),
                     ldap3.SEARCH_SCOPE_WHOLE_SUBTREE, attributes=['dn'])
            for r in c.response:
                if r['dn']:
                    user_dn = r['dn']

        if not user_dn:
            return False

        with ldap3.Connection(self._server, user=user_dn, password=password) as c:
            if not c.bound:
                return False

        return True

    def check_login(self, uid, password):
        "Запускает проверку логина в тредпуле и возвращает awaitable"
        return self._loop.run_in_executor(
            self._executor,
            self._sync_check_login,
            uid, password)
