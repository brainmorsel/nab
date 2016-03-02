import { combineReducers } from 'redux';
import { handleAction, handleActions } from 'redux-actions';
import u from 'updeep';
import { u_array_to_obj, u_one_or_more, u_payload_to_field } from 'app/util';

export default handleActions({
  DATA_GROUP_UPDATE_CHILDREN: (state, action) => {
    const { group_id, children, sideload } = action.payload;
    const hosts = u_array_to_obj('host_id', sideload.filter(i => i.type == 'host'));

    if (group_id === null || group_id === undefined) {
      const groups = u_array_to_obj('group_id', sideload.filter(i => i.type == 'group'));
      return u({
        root: { groups: children },
        groups,
        hosts,
      }, state);
    } else {
      const groups = u_array_to_obj('group_id',
        sideload
          .filter(i => i.type == 'group')
          .concat([{group_id, children},])
      );
      return u({
        groups,
        hosts,
      }, state);
    }
  },
  DATA_NETWORK_UPDATE_CHILDREN: (state, action) => {
    const { network_id, children, sideload } = action.payload;
    const networks = u_array_to_obj('network_id',
      sideload
        .concat([{network_id, children},])
    );
    if (network_id === null || network_id === undefined) {
      return u({
        root: { networks: children },
        networks,
      }, state);
    } else {
      return u({
        networks,
      }, state);
    }
  },
  DATA_GROUP_TYPE_UPDATE: (state, action) => {
    return u_one_or_more(state, action.payload, 'group_types', 'group_type_id');
  },
  DATA_HOST_TYPE_UPDATE: (state, action) => {
    return u_one_or_more(state, action.payload, 'host_types', 'host_type_id');
  },
  DATA_HOST_UPDATE: (state, action) => {
    return u_one_or_more(state, action.payload, 'hosts', 'host_id');
  },
  DATA_GROUP_UPDATE: (state, action) => {
    return u_one_or_more(state, action.payload, 'groups', 'group_id');
  },
  DATA_NETWORK_UPDATE: (state, action) => {
    return u_one_or_more(state, action.payload, 'networks', 'network_id');
  },
  DATA_HOST_IP_UPDATE: (state, action) => {
    return u_one_or_more(state, action.payload, 'host_ips', 'ip_id');
  },
  DATA_HOST_MAC_UPDATE: (state, action) => {
    return u_one_or_more(state, action.payload, 'host_macs', 'mac_id');
  },
  DATA_HOST_UPDATE_IPS: (state, action) => {
    const { host_id, ips } = action.payload;
    return u({
      hosts: { [host_id]: { ips } }
    }, state);
  },
  DATA_HOST_UPDATE_MACS: (state, action) => {
    const { host_id, macs } = action.payload;
    return u({
      hosts: { [host_id]: { macs } }
    }, state);
  },
  DATA_HOST_UPDATE_CLIENTS: (state, action) => {
    const { host_id, clients } = action.payload;
    return u({
      hosts: { [host_id]: { clients } }
    }, state);
  },
  DATA_NETWORKS_ALL_UPDATE: u_payload_to_field('networks_all'),
  DATA_SEARCH_QUERY_SET: (state, action) => {
    return u({
      search: {query: action.payload}
    }, state);
  },
  DATA_SEARCH_RESULTS_SET: (state, action) => {
    return u({
      search: {results: action.payload}
    }, state);
  },
  DATA_SEARCH_FETCHING_SET: (state, action) => {
    const { status, timerHandle } = action.payload;
    return u({
      search: {fetching: status, timerHandle}
    }, state);
  },
  DATA_GROUPS_CURRENT_PATH_SET: u_payload_to_field('groups_current_path'),
  DATA_CLIENT_TYPE_UPDATE: (state, action) => {
    return u_one_or_more(state, action.payload, 'client_types', 'client_type_id');
  },
}, {
  root: {
    groups: [],
    networks: [],
  },
  hosts: {},
  groups: {},
  groups_current_path: [],
  group_types: {},
  host_types: {},
  networks: {},
  host_ips: {},
  host_macs: {},
  networks_all: [],  // list of IDs of all networks
  client_types: {},
  search: {
    fetching: false,
    timerHandle: null,
    query: '',
    results: [],
  }
});
