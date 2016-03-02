const prefix = '/';

export default {
    prefix: prefix,
    index: () => prefix,
    cmdb: {
      index: () => `${prefix}cmdb`,
      group: {
        show: (group_id) => (
          group_id !== undefined && group_id !== null
            ? `${prefix}cmdb/group/${group_id}`
            : `${prefix}cmdb/group/`
        ),
        edit: (group_id) => `${prefix}cmdb/group/${group_id}/edit`,
        move: (group_id) => `${prefix}cmdb/group/${group_id}/move`,
        delete: (group_id) => `${prefix}cmdb/group/${group_id}/delete`,
        create: (parent_id) => (
          parent_id !== undefined && parent_id !== null
            ? `${prefix}cmdb/group/${parent_id}/new-group`
            : `${prefix}cmdb/group/new`
        ),
      },
      host: {
        show: (host_id) => `${prefix}cmdb/host/${host_id}`,
        edit: (host_id) => `${prefix}cmdb/host/${host_id}/edit`,
        move: (host_id) => `${prefix}cmdb/host/${host_id}/move`,
        delete: (host_id) => `${prefix}cmdb/host/${host_id}/delete`,
        create: (group_id) => `${prefix}cmdb/group/${group_id}/new-host`,
        clients: (host_id) => `${prefix}cmdb/host/${host_id}/clients`,
      },
      network: {
        show: (network_id='') => (
          network_id === undefined || network_id === null
            ? `${prefix}cmdb/network/`
            : `${prefix}cmdb/network/${network_id}`),
        edit: (network_id) => `${prefix}cmdb/network/${network_id}/edit`,
        create: (parent_id) => (
          parent_id !== undefined
            ? `${prefix}cmdb/network/${parent_id}/new`
            : `${prefix}cmdb/network/new`
        ),
      },
      group_type: {
        show: (group_type_id) => (
          group_type_id !== undefined
            ? `${prefix}cmdb/group-type/${group_type_id}`
            : `${prefix}cmdb/group-type/create`
        ),
      },
      host_type: {
        show: (host_type_id) => (
          host_type_id !== undefined
            ? `${prefix}cmdb/host-type/${host_type_id}`
            : `${prefix}cmdb/host-type/create`
        ),
      },
    },
    events: {
      index: () => `${prefix}events`,
      problems: () => `${prefix}events/problems`,
    },
};
