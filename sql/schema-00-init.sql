CREATE TABLE IF NOT EXISTS group_type (
     group_type_id serial PRIMARY KEY
    ,name varchar NOT NULL CHECK (length(name) > 0)
    ,icon_name varchar NOT NULL CHECK (length(name) > 0)
    ,description varchar NOT NULL DEFAULT ''
    ,UNIQUE (name)
    );

CREATE TABLE IF NOT EXISTS "group" (
     group_id serial PRIMARY KEY
    ,parent_id integer REFERENCES "group"
    ,name varchar NOT NULL CHECK (length(name) > 0)
    ,group_type_id integer NOT NULL REFERENCES group_type
    ,description varchar NOT NULL DEFAULT ''
    ,UNIQUE (parent_id, name)
    );

CREATE TABLE IF NOT EXISTS network (
     network_id serial PRIMARY KEY
    ,parent_id integer REFERENCES network (network_id)
    ,name varchar NOT NULL CHECK (length(name) > 0)
    ,addr cidr
    ,vlan_id integer
    ,vlan_qinq_id integer
    ,mpls_id integer
    ,description varchar NOT NULL DEFAULT ''
    );

CREATE TABLE IF NOT EXISTS host_type (
     host_type_id serial PRIMARY KEY
    ,name varchar NOT NULL CHECK (length(name) > 0)
    ,description varchar NOT NULL DEFAULT ''
    ,UNIQUE (name)
    );

CREATE TABLE IF NOT EXISTS host (
     host_id serial PRIMARY KEY
    ,group_id integer NOT NULL REFERENCES "group"
    ,host_type_id integer NOT NULL REFERENCES host_type
    ,name varchar NOT NULL CHECK (length(name) > 0)
    ,snmp_community_public varchar NOT NULL DEFAULT 'public'
    ,snmp_community_private varchar NOT NULL DEFAULT 'private'
    ,data jsonb NOT NULL DEFAULT '{}'
    ,description varchar NOT NULL DEFAULT ''
    );

CREATE TABLE IF NOT EXISTS host_ip (
     ip_id serial PRIMARY KEY
    ,host_id integer REFERENCES host ON DELETE CASCADE
    ,interface_name varchar CHECK (length(interface_name) > 0)
    ,network_id integer NOT NULL REFERENCES network
    ,addr inet NOT NULL
    ,description varchar NOT NULL DEFAULT ''
    ,UNIQUE (network_id, addr)
    );

CREATE TABLE IF NOT EXISTS host_ip_icmp_status (
     ip_id integer REFERENCES host_ip ON DELETE CASCADE
    -- icmp_status: 1 - UNKNOWN, 2 - UNREACHABLE, 3 - ALIVE
    ,icmp_status integer NOT NULL DEFAULT 1 CHECK (icmp_status >= 1 AND icmp_status <= 3)
    ,last_change_time timestamp with time zone NOT NULL DEFAULT now()
    );

CREATE TABLE IF NOT EXISTS events_archive (
     event_id serial PRIMARY KEY
    ,host_id integer NOT NULL REFERENCES host ON DELETE CASCADE
    ,ip_id integer REFERENCES host_ip ON DELETE CASCADE
    ,service_type varchar NOT NULL CHECK (length(service_type) > 0)
    -- severity: 1 - UNKNOWN, 2 - INFO, 3 - WARNING, 4 - CRITICAL, 5 - OK
    ,severity integer NOT NULL DEFAULT 1 CHECK (severity >= 1 AND severity <= 5)
    ,event_time timestamp with time zone NOT NULL DEFAULT now()
    ,data jsonb NOT NULL DEFAULT '{}'
    );

CREATE TABLE IF NOT EXISTS host_mac (
     mac_id serial PRIMARY KEY
    ,host_id integer NOT NULL REFERENCES host ON DELETE CASCADE
    ,interface_name varchar CHECK (length(interface_name) > 0)
    ,addr macaddr NOT NULL
    );

CREATE TABLE IF NOT EXISTS user_audit (
     id serial PRIMARY KEY
    ,username varchar NOT NULL CHECK (length(username) > 0)
    ,action varchar NOT NULL CHECK (length(action) > 0)
    ,data jsonb NOT NULL DEFAULT '{}'
    ,action_time timestamp with time zone NOT NULL DEFAULT now()
    );

CREATE TABLE IF NOT EXISTS client_type (
     client_type_id serial PRIMARY KEY
    ,name varchar NOT NULL CHECK (length(name) > 0)
    ,description varchar NOT NULL DEFAULT ''
    ,UNIQUE (name)
    );

CREATE TABLE IF NOT EXISTS client (
     client_id serial PRIMARY KEY
    ,client_type_id integer NOT NULL REFERENCES client_type
    ,name varchar NOT NULL CHECK (length(name) > 0)
    ,description varchar NOT NULL DEFAULT ''
    ,UNIQUE (name)
    );

CREATE TABLE IF NOT EXISTS client_current_session (
     client_id integer PRIMARY KEY REFERENCES client ON DELETE CASCADE
    ,time_start timestamp with time zone DEFAULT now()
    ,time_end timestamp with time zone
    ,nas_ip inet DEFAULT NULL
    ,client_ip inet DEFAULT NULL
    );

CREATE TABLE IF NOT EXISTS client_port_owner (
     client_id integer PRIMARY KEY REFERENCES client ON DELETE CASCADE
    ,host_id integer NOT NULL REFERENCES host ON DELETE CASCADE
    ,port_id integer NOT NULL
    ,client_mac macaddr DEFAULT NULL
    ,update_time timestamp with time zone NOT NULL DEFAULT now()
    ,UNIQUE (host_id, port_id)
    );

CREATE TABLE IF NOT EXISTS client_igmp_profile_status (
     client_id integer NOT NULL REFERENCES client ON DELETE CASCADE
    ,profile_id integer NOT NULL
    ,active boolean NOT NULL DEFAULT false
    ,update_time timestamp with time zone NOT NULL DEFAULT now()
    ,UNIQUE (client_id, profile_id)
    );

CREATE TABLE IF NOT EXISTS host_snmp_inventory (
     host_id integer NOT NULL REFERENCES host ON DELETE CASCADE
    ,sys_oid varchar NOT NULL DEFAULT ''
    ,sys_descr varchar NOT NULL DEFAULT ''
    );
