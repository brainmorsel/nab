from setuptools import setup, find_packages

setup(
    name='nwaddrbook',
    version='0.1',
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        'click==6.2',
        'aiopg==0.7.0',
        'aiohttp==0.19.0',
        'aiohttp-session==0.3.0',
        'aiohttp-cors==0.2.0',
        'cryptography==1.1.1',
        'aiohttp-jinja2==0.6.2',
        'autobahn==0.10.9',
        'PyYAML==3.11',
        'ldap3==0.9.9.3'
    ],
    entry_points='''
        [console_scripts]
        nab-webserver=nwaddrbook.scripts.webserver:cli
        nab-icmp-poller=nwaddrbook.scripts.icmp_poller:cli
    ''',
)