CREATE TABLE IF NOT EXISTS group_type (
     group_type_id serial PRIMARY KEY
    ,name varchar NOT NULL CHECK (length(name) > 0)
    ,icon_name varchar NOT NULL CHECK (length(name) > 0)
    ,UNIQUE (name)
    );

CREATE TABLE IF NOT EXISTS "group" (
     group_id serial PRIMARY KEY
    ,parent_id integer REFERENCES "group"
    ,name varchar NOT NULL CHECK (length(name) > 0)
    ,group_type_id integer NOT NULL REFERENCES group_type
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
    );

CREATE TABLE IF NOT EXISTS host_type (
     host_type_id serial PRIMARY KEY
    ,name varchar NOT NULL CHECK (length(name) > 0)
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
    );

CREATE TABLE IF NOT EXISTS host_ip (
     ip_id serial PRIMARY KEY
    ,host_id integer REFERENCES host ON DELETE CASCADE
    ,interface_name varchar CHECK (length(interface_name) > 0)
    ,network_id integer NOT NULL REFERENCES network
    ,addr inet NOT NULL
    );

CREATE TABLE IF NOT EXISTS host_mac (
     mac_id serial PRIMARY KEY
    ,host_id integer REFERENCES host ON DELETE CASCADE
    ,interface_name varchar CHECK (length(interface_name) > 0)
    ,addr macaddr NOT NULL
    );

CREATE TABLE IF NOT EXISTS user_audit (
     id serial PRIMARY KEY
    ,username varchar
    ,action varchar
    ,data jsonb
    ,action_time timestamp with time zone NOT NULL DEFAULT now()
    );
