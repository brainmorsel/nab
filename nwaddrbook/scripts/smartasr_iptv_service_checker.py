import logging
import urllib.request
import json

import click
import sqlalchemy
from sqlalchemy import sql

from .. import conf

SQL_SELECT_IPTV_STATUS = '''
    SELECT DISTINCT
         case status.status
            when 1 then 'active'  -- новый
            when 3 then 'active'  -- активный
            when 4 then 'suspended' -- приостановленый
            when 5 then 'suspended' -- заблокированый
         end as status
        ,ip_u.login

    FROM core.accounts ac
    JOIN core.accounts child ON child.parent_id = ac.id AND ac.parent_id IS NULL
    JOIN core.account_statuses_enddate status ON child.id = status.account_id
            AND (status.end_date IS NULL OR status.end_date > CURRENT_DATE)
            AND (status.start_date < CURRENT_DATE)
    JOIN core.users u ON child.id = u.account_id AND u.service_type = 10

    JOIN core.accounts child_ip ON child_ip.parent_id = ac.id
    JOIN core.users u_ip ON child_ip.id = u_ip.account_id AND u_ip.service_type = 3
    JOIN iptraf.users ip_u ON ip_u.user_id = u_ip.id AND ip_u.end_date IS NULL AND ip_u.user_type = 8

    WHERE
        status.status IN (1, 3, 4, 5)
'''

SQL_SELECT_NAB = '''
    SELECT c.name, s.active
    FROM client c
    JOIN client_igmp_profile_status s ON s.client_id = c.client_id
'''


def send_events(cfg, events):
    logging.info('send {0}'.format(len(events)))
    postdata = {'events': events}
    data = json.dumps(postdata).encode('utf-8')

    req = urllib.request.Request(cfg.events_sink_url, data=data,
                                 headers={'content-type': 'application/json'})
    response = urllib.request.urlopen(req)
    return json.loads(response.read().decode('utf8'))


def make_event(cfg, client_name, is_active):
    return {
        'event': 'client-igmp-update',
        'profile_id': cfg.profile_id,
        'client_name': client_name,
        'active': is_active,
    }


@click.command()
@click.option('-c', '--config', 'config_path', type=click.Path(exists=True, readable=True, dir_okay=False), required=True)
def cli(config_path):
    cfg = conf.load(config_path)

    db_nab = sqlalchemy.create_engine(cfg.nab_db_uri, pool_recycle=300)

    current_status = {}
    with db_nab.connect() as c_nab:
        for r in c_nab.execute(sql.text(SQL_SELECT_NAB)):
            current_status[r.name] = r.active

    events = []
    for dburi in cfg.billing_db_uri:
        db_billing = sqlalchemy.create_engine(dburi, pool_recycle=300)
        with db_billing.connect() as c_billing:
            for r in c_billing.execute(sql.text(SQL_SELECT_IPTV_STATUS)):
                is_active = r.status == 'active'
                client_name = r.login

                if client_name in current_status and current_status[client_name] == is_active:
                    pass
                else:
                    events.append(make_event(cfg, client_name, is_active))
                    if len(events) >= cfg.batch_size:
                        send_events(cfg, events)
                        events = []

        if (len(events) > 0):
            # отправить оставшиеся
            send_events(cfg, events)
