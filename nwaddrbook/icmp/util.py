import os
import pwd
import grp


def drop_privileges(uid_name='nobody', gid_name='nogroup'):
    if os.getuid() != 0:
        # We're not root so, like, whatever dude
        return

    # Get the uid/gid from the name
    sudo_user = os.getenv("SUDO_USER")
    if sudo_user:
        pwnam = pwd.getpwnam(sudo_user)
        running_uid = pwnam.pw_uid
        running_gid = pwnam.pw_gid
    else:
        running_uid = pwd.getpwnam(uid_name).pw_uid
        running_gid = grp.getgrnam(gid_name).gr_gid

    # Remove group privileges
    os.setgroups([])

    # Try setting the new uid/gid
    os.setgid(running_gid)
    os.setuid(running_uid)

    # Ensure a very conservative umask
    os.umask(0o22)
