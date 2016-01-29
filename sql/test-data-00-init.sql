INSERT INTO group_type (group_type_id, name, icon_name) VALUES
     (1, 'group', 'folder')
    ,(2, 'city', 'fort-awesome')
    ,(3, 'street', 'road')
    ,(4, 'building', 'home')
    ;

INSERT INTO "group" (group_id, parent_id, group_type_id, name) VALUES
     (1, NULL, 2, 'Город')
    ,(2, 1, 3, 'Улица')
    ,(3, 2, 4, 'Строение 1')
    ,(4, 2, 4, 'Строение 2')
    ;

INSERT INTO network (network_id, name, addr, vlan_id) VALUES
     (1, 'default', '0.0.0.0/0', 1)
    ;

INSERT INTO host_type (host_type_id, name) VALUES
     (1, 'unknown')
    ,(2, 'switch')
    ,(3, 'server')
    ;

INSERT INTO host (host_id, group_id, host_type_id, name) VALUES
     (1, 2, 1, 'switch-a.lan')
    ,(2, 3, 2, 'switch-b.lan')
    ,(3, 4, 3, 'server-a.lan')
    ;

INSERT INTO host_ip (ip_id, host_id, network_id, addr, interface_name) VALUES
     (1, 1, 1, '10.9.8.1', NULL)
    ,(2, 2, 1, '10.9.8.2', NULL)
    ,(3, 3, 1, '10.9.8.3', 'eth0')
    ;

INSERT INTO client_type (client_type_id, name) VALUES
     (1, 'internal')
    ,(2, 'customer')
    ;
