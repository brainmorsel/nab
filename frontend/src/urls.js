const prefix = '/';

export default {
    prefix: prefix,
    home: () => prefix,
    events: {
      show: () => `${prefix}events/`,
    },
    group: {
      show: (group_id='') => `${prefix}group/${group_id}`,
      edit: (group_id) => `${prefix}group/${group_id}/edit`,
      move: (group_id) => `${prefix}group/${group_id}/move`,
      create: (parent_id) => (
        parent_id !== undefined
          ? `${prefix}group/${parent_id}/new-group`
          : `${prefix}group/new`
      ),
    },
    host: {
      show: (host_id) => `${prefix}host/${host_id}`,
      edit: (host_id) => `${prefix}host/${host_id}/edit`,
      move: (host_id) => `${prefix}host/${host_id}/move`,
      create: (group_id) => `${prefix}group/${group_id}/new-host`,
    },
    network: {
      show: (network_id='') => (
        network_id === undefined || network_id === null
          ? `${prefix}network/`
          : `${prefix}network/${network_id}`),
      edit: (network_id) => `${prefix}network/${network_id}/edit`,
      create: (parent_id) => (
        parent_id !== undefined
          ? `${prefix}network/${parent_id}/new`
          : `${prefix}network/new`
      ),
    },
    group_type: {
      show: (group_type_id) => (
        group_type_id !== undefined
          ? `${prefix}group_type/${group_type_id}`
          : `${prefix}group_type/create`
      ),
    },
    host_type: {
      show: (host_type_id) => (
        host_type_id !== undefined
          ? `${prefix}host_type/${host_type_id}`
          : `${prefix}host_type/create`
      ),
    },
};
