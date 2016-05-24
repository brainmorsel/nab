import { createAction } from 'redux-actions';
import * as webapi from 'webapi';
import * as app from 'app/actions';


export const dataGroupUpdateChildren = createAction('DATA_GROUP_UPDATE_CHILDREN');
export const dataNetworkUpdateChildren = createAction('DATA_NETWORK_UPDATE_CHILDREN');
export const dataGroupTypeUpdate = createAction('DATA_GROUP_TYPE_UPDATE');
export const dataHostTypeUpdate = createAction('DATA_HOST_TYPE_UPDATE');
export const dataHostUpdate = createAction('DATA_HOST_UPDATE');
export const dataGroupUpdate = createAction('DATA_GROUP_UPDATE');
export const dataNetworksAllUpdate = createAction('DATA_NETWORKS_ALL_UPDATE');
export const dataNetworkUpdate = createAction('DATA_NETWORK_UPDATE');
export const dataHostUpdateIps = createAction('DATA_HOST_UPDATE_IPS');
export const dataHostUpdateMacs = createAction('DATA_HOST_UPDATE_MACS');
export const dataHostIpUpdate = createAction('DATA_HOST_IP_UPDATE');
export const dataHostMacUpdate = createAction('DATA_HOST_MAC_UPDATE');
export const dataSearchQuerySet = createAction('DATA_SEARCH_QUERY_SET');
export const dataSearchResultsSet = createAction('DATA_SEARCH_RESULTS_SET');
export const dataSearchFetchingSet = createAction('DATA_SEARCH_FETCHING_SET');
export const dataGroupsCurrentPathSet = createAction('DATA_GROUPS_CURRENT_PATH_SET');
export const dataClientTypeUpdate = createAction('DATA_CLIENT_TYPE_UPDATE');
export const dataHostUpdateClients = createAction('DATA_HOST_UPDATE_CLIENTS');


export const loadGroupChildren = (group_id=null) => {
  return (dispatch, getState) => {
    if (group_id !== null) {
      group_id = 1*group_id; // cast to number
    }
    return webapi.call('group_get_children', {group_id})
      .then(response => {
        const { children, sideload } = response.data.result;
        dispatch(dataGroupUpdateChildren({group_id, children, sideload}));
      })
      .catch(error => {
        dispatch(app.errorsAddMessage(error));
      })
  };
};

export const loadNetworkChildren = (network_id=null) => {
  return (dispatch, getState) => {
    if (network_id !== null) {
      network_id = 1*network_id; // cast to number
    }
    return webapi.call('network_get_children', {network_id})
      .then(response => {
        const { children, sideload } = response.data.result;
        dispatch(dataNetworkUpdateChildren({network_id, children, sideload}));
      })
      .catch(error => {
        dispatch(app.errorsAddMessage(error));
      })
  };
};

export const loadGroupTypes = () => {
  return (dispatch, getState) => {
    return webapi.call('group_type_get_all')
      .then(response => {
        const { items } = response.data.result;
        dispatch(dataGroupTypeUpdate(items));
      })
      .catch(error => {
        dispatch(app.errorsAddMessage(error));
      })
  };
}

export const loadHostTypes = () => {
  return (dispatch, getState) => {
    return webapi.call('host_type_get_all')
      .then(response => {
        const { items } = response.data.result;
        dispatch(dataHostTypeUpdate(items));
      })
      .catch(error => {
        dispatch(app.errorsAddMessage(error));
      })
  };
}

export const loadClientTypes = () => {
  return (dispatch, getState) => {
    return webapi.call('client_type_get_all')
      .then(response => {
        const { items } = response.data.result;
        dispatch(dataClientTypeUpdate(items));
      })
      .catch(error => {
        dispatch(app.errorsAddMessage(error));
      })
  };
}

// Загрузить сразу пачку хостов по списку их id
export const loadHosts = (ids) => {
  return (dispatch, getState) => {
    return webapi.call('host_get_batch', {ids})
      .then(response => {
        if (response.data.success) {
          dispatch(dataGroupUpdate(response.data.result.groups))
          dispatch(dataHostUpdate(response.data.result.hosts))
        } else {
          dispatch(app.errorsAddMessage(response.data.error));
        }
      })
      .catch(error => {
        dispatch(app.errorsAddMessage(error));
      })
  };
}

export const loadGroups = (ids) => {
  return (dispatch, getState) => {
    return webapi.call('group_get_batch', {ids})
      .then(response => {
        if (response.data.success) {
          dispatch(dataGroupUpdate(response.data.result.groups))
        } else {
          dispatch(app.errorsAddMessage(response.data.error));
        }
      })
      .catch(error => {
        dispatch(app.errorsAddMessage(error));
      })
  };
}

export const loadNetworks = () => {
  return (dispatch, getState) => {
    return webapi.call('network_get_all')
      .then(response => {
        const { ids, sideload } = response.data.result;
        if (sideload) {
          dispatch(dataNetworkUpdate(sideload));
        }
        dispatch(dataNetworksAllUpdate(ids));
      })
      .catch(error => {
        dispatch(app.errorsAddMessage(error));
      })
  }
};

export const loadHostIps = (host_id) => {
  return (dispatch, getState) => {
    host_id = 1*host_id; // cast to number

    return webapi.call('host_get_ips', {host_id})
      .then(response => {
        const { ips, sideload } = response.data.result;
        if (sideload) {
          dispatch(dataHostIpUpdate(sideload));
        }
        dispatch(dataHostUpdateIps({host_id, ips}));
      })
      .catch(error => {
        dispatch(app.errorsAddMessage(error));
      })
  };
};

export const loadHostMacs = (host_id) => {
  return (dispatch, getState) => {
    host_id = 1*host_id; // cast to number

    return webapi.call('host_get_macs', {host_id})
      .then(response => {
        const { macs, sideload } = response.data.result;
        if (sideload) {
          dispatch(dataHostMacUpdate(sideload));
        }
        dispatch(dataHostUpdateMacs({host_id, macs}));
      })
      .catch(error => {
        dispatch(app.errorsAddMessage(error));
      })
  };
};

export const loadHostClients = (host_id) => {
  return (dispatch, getState) => {
    host_id = 1*host_id; // cast to number

    return webapi.call('host_get_clients', {host_id})
      .then(response => {
        if (response.data.success) {
          const { clients } = response.data.result;
          dispatch(dataHostUpdateClients({host_id, clients}));
        } else {
          dispatch(app.errorsAddMessage(response.data.error));
        }
      })
      .catch(error => {
        dispatch(app.errorsAddMessage(error));
      })
  };
};

export const saveItem = (item) => {
  return (dispatch, getState) => {
    const api_method = `${item.type}_save`;

    return webapi.call(api_method, item)
      .then(response => {
        if (!response.data.success) {
          dispatch(app.errorsAddMessage(response.data.error));
        }
      })
      .catch(error => {
        dispatch(app.errorsAddMessage(error));
      })
  };
}

function getItemIdName(item) {
  const idNameMap = {
    'group': 'group_id',
    'host': 'host_id',
    'network': 'network_id',
    'host_ip': 'ip_id',
    'host_mac': 'mac_id',
    'host_type': 'host_type_id',
    'group_type': 'group_type_id',
  }

  return idNameMap[item.type];
}

function getItemParentIdName(item) {
  const idNameMap = {
    'group': 'parent_id',
    'host': 'group_id',
    'network': 'network_id',
    'host_ip': 'host_id',
    'host_mac': 'host_id',
  }

  return idNameMap[item.type];
}

// переместить хост или группу в новую группу.
export const moveItem = (item, target) => {
  return (dispatch, getState) => {
    const id_name = getItemIdName(item);
    const parent_id_name = getItemParentIdName(item);
    const target_id = target[getItemIdName(target)];
    const params = {
      [id_name]: item[id_name],
      [parent_id_name]: target_id,
    };
    const api_method = `${item.type}_move`;

    return webapi.call(api_method, params)
      .then(response => {
        if (!response.data.success) {
          dispatch(app.errorsAddMessage(response.data.error));
        }
      })
      .catch(error => {
        dispatch(app.errorsAddMessage(error));
      })
  };
}

export const deleteItem = (item) => {
  return (dispatch, getState) => {
    const id_name = getItemIdName(item);
    const params = {[id_name]: item[id_name]};
    const api_method = `${item.type}_delete`;

    return webapi.call(api_method, params)
      .then(response => {
        if (!response.data.success) {
          dispatch(app.errorsAddMessage(response.data.error));
        }
      })
      .catch(error => {
        dispatch(app.errorsAddMessage(error));
      })
  }
}

export const loadSearchResults = (query, delay=0.5) => {
  return (dispatch, getState) => {
    const state = getState();
    clearTimeout(state.app.cmdb.search.timerHandle);
    dispatch(dataSearchQuerySet(query));
    if (query.length == 0) {
      dispatch(dataSearchResultsSet([]));
      dispatch(dataSearchFetchingSet({status: false, timerHandle: null}));
      return;
    }
    const timerHandle = setTimeout(() => {
      const state = getState();
      const q = query.trim();

      if (state.app.cmdb.search.query == q && q.length >= 3) {
        webapi.call('search', {q})
          .then(response => {
            const result = response.data.result;
            if (response.data.success) {
              let unloaded_groups = [];
              let unloaded_hosts = [];
              for (let i = 0; i < result.length; i++) {
                let r = result[i];
                switch (r.type) {
                  case 'group':
                    if (!state.app.cmdb.groups[r.group_id]) {
                      unloaded_groups.push(r.group_id);
                    }
                    break;
                  case 'client':
                  case 'host':
                  case 'host_ip':
                    if (!state.app.cmdb.hosts[r.host_id]) {
                      unloaded_hosts.push(r.host_id);
                    }
                }
              }
              if (unloaded_groups.length > 0) {
                dispatch(loadGroups(unloaded_groups));
              }
              if (unloaded_hosts.length > 0) {
                dispatch(loadHosts(unloaded_hosts));
              }
              dispatch(dataSearchResultsSet(result));
              dispatch(dataSearchFetchingSet({status: false, timerHandle: null}));
            } else {
              dispatch(app.errorsAddMessage(response.data.error));
              dispatch(dataSearchFetchingSet({status: false, timerHandle: null}));
            }
          })
          .catch(error => {
            dispatch(app.errorsAddMessage(error));
          })
      }
    }, delay * 1000);
    dispatch(dataSearchFetchingSet({status: true, timerHandle}));
  };
}

export const setCurrentGroup = (group_id, host_id) => {
  return (dispatch, getState) => {
    const { app: { cmdb: { groups, hosts } } } = getState();
    if (host_id) {
      group_id = hosts[host_id].group_id;
    }
    let ids = [];
    let cur = groups[group_id];
    while (cur) {
      ids.push(cur.group_id);
      cur = groups[cur.parent_id];
    }
    dispatch(dataGroupsCurrentPathSet(ids))
  }
}
