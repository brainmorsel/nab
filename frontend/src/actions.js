import { createAction } from 'redux-actions';
import moment from 'moment';
import * as webapi from './webapi';

export const globalSpinnerJobStart = createAction('GLOBAL_SPINNER_JOB_START');
export const globalSpinnerJobSuccess = createAction('GLOBAL_SPINNER_JOB_SUCCESS');
export const globalSpinnerJobFail = createAction('GLOBAL_SPINNER_JOB_FAIL');

export const errorsAddMessage = createAction('ERRORS_ADD_MESSAGE');
export const errorsClear = createAction('ERRORS_CLEAR');

export const dataHostUpdate = createAction('DATA_HOST_UPDATE');
export const dataGroupUpdate = createAction('DATA_GROUP_UPDATE');
export const dataNetworkUpdate = createAction('DATA_NETWORK_UPDATE');
export const dataGroupUpdateChildren = createAction('DATA_GROUP_UPDATE_CHILDREN');
export const dataNetworkUpdateChildren = createAction('DATA_NETWORK_UPDATE_CHILDREN');
export const dataHostUpdateIps = createAction('DATA_HOST_UPDATE_IPS');
export const dataHostUpdateMacs = createAction('DATA_HOST_UPDATE_MACS');
export const dataHostIpUpdate = createAction('DATA_HOST_IP_UPDATE');
export const dataHostMacUpdate = createAction('DATA_HOST_MAC_UPDATE');
export const menuGroupsUpdateChildren = createAction('MENU_GROUPS_UPDATE_CHILDREN');
export const menuNetworksUpdateChildren = createAction('MENU_NETWORKS_UPDATE_CHILDREN');

export const fetcherFetchingStart = createAction('FETCHER_FETCHING_START');
export const fetcherFetchingDone = createAction('FETCHER_FETCHING_DONE');

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


function fetchNormalizeItem(item) {
  const { type } = item;
  const { id_name } = getItemIdName(item);
  if (id_name) {
    return {type, id: item[id_name]};
  } else {
    return {type, id: item.id};
  }
}

function fetchProcessStart(item, dispatch, state) {
  const i = fetchNormalizeItem(item);
  const isRunning = ((state.fetcher.fetching_now[i.type]||{})[i.id]||{}).r;

  if (isRunning) {
    return true;
  } else {
    dispatch(fetcherFetchingStart(i));
    return false;
  }
}

function fetchProcessDone(item, dispatch, state) {
  dispatch(fetcherFetchingDone(fetchNormalizeItem(item)));
}

function dispatchSideload(items, dispatch) {
  items.forEach(item => {
    switch (item.type) {
      case 'group':
        dispatch(dataGroupUpdate(item));
        break;
      case 'host':
        dispatch(dataHostUpdate(item));
        break;
      case 'network':
        dispatch(dataNetworkUpdate(item));
        break;
      case 'host_ip':
        dispatch(dataHostIpUpdate(item));
        break;
      case 'host_mac':
        dispatch(dataHostMacUpdate(item));
        break;
    }
  });
}

export const loadGroupItems = (group_id=null) => {
    return (dispatch, getState) => {
        return webapi.call('group_get_children', {group_id})
            .then(response => {
                const { children, sideload } = response.data.result;
                //if (sideload) {
                //  dispatchSideload(sideload, dispatch);
                //}
                if (group_id === null || group_id === undefined) {
                  dispatch(menuGroupsUpdateChildren({children, sideload}));
                } else {
                  dispatch(dataGroupUpdateChildren({group_id, children, sideload}));
                }
            })
    };
};

export const loadNetworkItems = (network_id=null) => {
    return (dispatch, getState) => {
        return webapi.call('network_get_children', {network_id})
            .then(response => {
                const { children, sideload } = response.data.result;
                if (sideload) {
                  dispatchSideload(sideload, dispatch);
                }
                if (network_id === null || network_id === undefined) {
                  dispatch(menuNetworksUpdateChildren({children}));
                } else {
                  dispatch(dataNetworkUpdateChildren({network_id, children}));
                }
            })
    };
};

export const loadHostIps = (host_id) => {
    return (dispatch, getState) => {
        return webapi.call('host_get_ips', {host_id})
            .then(response => {
                const { ips, sideload } = response.data.result;
                if (sideload) {
                  dispatchSideload(sideload, dispatch);
                }
                dispatch(dataHostUpdateIps({host_id, ips}));
            })
    };
};

export const loadHostMacs = (host_id) => {
    return (dispatch, getState) => {
        return webapi.call('host_get_macs', {host_id})
            .then(response => {
                const { macs, sideload } = response.data.result;
                if (sideload) {
                  dispatchSideload(sideload, dispatch);
                }
                dispatch(dataHostUpdateMacs({host_id, macs}));
            })
    };
};

export const dataNetworksAllUpdateStart = createAction('DATA_NETWORKS_ALL_UPDATE_START');
export const dataNetworksAllUpdate = createAction('DATA_NETWORKS_ALL_UPDATE');

export const loadNetworksAll = () => {
  return (dispatch, getState) => {
    const state = getState();

    if (!state.data.networks_all_loading) {
      dispatch(dataNetworksAllUpdateStart());
      webapi.call('network_get_all')
        .then(response => {
          const { ids, sideload } = response.data.result;
          if (sideload) {
            dispatchSideload(sideload, dispatch);
          }
          dispatch(dataNetworksAllUpdate(ids));
        })
    }

    return state.data.networks_all;
  };
};

export const getItemDataAsync = (item) => {
  return (dispatch, getState) => {
    const state = getState();

    if (fetchProcessStart(item, dispatch, state)) {
      return;
    }

    return new Promise((resolve, reject) => {
      switch (item.type) {
        case 'group':
          if (state.data.groups[item.group_id]) {
            resolve(state.data.groups[item.group_id]);
          } else {
            webapi.call('group_get', {group_id: item.group_id})
              .then(response => {
                fetchProcessDone(item, dispatch, state);
                dispatch(dataGroupUpdate(response.data.result.group));
                resolve(response.data.result.group);
              })
          }
          break;

        case 'host':
          if (state.data.hosts[item.host_id]) {
            resolve(state.data.hosts[item.host_id]);
          } else {
            webapi.call('host_get', {host_id: item.host_id})
              .then(response => {
                fetchProcessDone(item, dispatch, state);
                dispatch(dataHostUpdate(response.data.result.host));
                resolve(response.data.result.host);
              })
          }
          break;

        case 'network':
          if (state.data.networks[item.network_id]) {
            resolve(state.data.networks[item.network_id]);
          } else {
            webapi.call('network_get', {network_id: item.network_id})
              .then(response => {
                fetchProcessDone(item, dispatch, state);
                dispatch(dataNetworkUpdate(response.data.result.network));
                resolve(response.data.result.network);
              })
          }
          break;

        default:
          reject('unsupported type');
      }
    });
  };
}

export const dataGroupTypeUpdateAll = createAction('DATA_GROUP_TYPE_UPDATE_ALL');
export const getGroupTypesAsync = () => {
  return (dispatch, getState) => {
    return new Promise((resolve, reject) => {
      webapi.call('group_type_get_all')
        .then(response => {
            const { items } = response.data.result;
            dispatch(dataGroupTypeUpdateAll(items));
            resolve(items);
        })
    });
  };
}

export const dataHostTypeUpdateAll = createAction('DATA_HOST_TYPE_UPDATE_ALL');
export const getHostTypesAsync = () => {
  return (dispatch, getState) => {
    return new Promise((resolve, reject) => {
      webapi.call('host_type_get_all')
        .then(response => {
            const { items } = response.data.result;
            dispatch(dataHostTypeUpdateAll(items));
            resolve(items);
        })
    });
  };
}

export const saveGroupData = (data) => {
  return (dispatch, getState) => {
    return saveItem(dispatch, 'group', data)
      .then(() => {dispatch(loadGroupItems(data.parent_id))});
  }
}

export const saveHostData = (data) => {
  return (dispatch, getState) => {
    return saveItem(dispatch, 'host', data)
      .then(() => {dispatch(loadGroupItems(data.group_id))});
  }
}

export const saveNetworkData = (data) => {
  return (dispatch, getState) => {
    return saveItem(dispatch, 'network', data)
      .then(() => {dispatch(loadNetworkItems(data.parent_id))});
  }
}

export const saveGroupTypeData = (data) => {
  return (dispatch, getState) => {
    return saveItem(dispatch, 'group_type', data)
      .then(() => {dispatch(getGroupTypesAsync())});
  }
}

export const saveHostTypeData = (data) => {
  return (dispatch, getState) => {
    return saveItem(dispatch, 'host_type', data)
      .then(() => {dispatch(getHostTypesAsync())});
  }
}

export const saveHostIpData = (data) => {
  return (dispatch, getState) => {
    return saveItem(dispatch, 'host_ip', data)
      .then(() => {dispatch(loadHostIps(data.host_id))});
  }
}

export const saveHostMacData = (data) => {
  return (dispatch, getState) => {
    return saveItem(dispatch, 'host_mac', data)
      .then(() => {dispatch(loadHostMacs(data.host_id))});
  }
}


export const deleteHostIp = (item) => {
  return (dispatch, getState) => {
    return deleteItem(item, dispatch)
      .then(() => {dispatch(loadHostIps(item.host_id))})
  };
}

export const deleteHostMac = (item) => {
  return (dispatch, getState) => {
    return deleteItem(item, dispatch)
      .then(() => {dispatch(loadHostMacs(item.host_id))})
  };
}

export const deleteHost = (item) => {
  return (dispatch, getState) => {
    return deleteItem(item, dispatch)
      .then(() => {dispatch(loadGroupItems(item.group_id))})
  };
}

export const deleteGroup = (item) => {
  return (dispatch, getState) => {
    return deleteItem(item, dispatch)
      .then(() => {dispatch(loadGroupItems(item.parent_id))})
  };
}

export const deleteNetwork = (item) => {
  return (dispatch, getState) => {
    return deleteItem(item, dispatch)
      .then(() => {dispatch(loadNetworkItems(item.parent_id))})
  };
}

// переместить хост или группу в новую группу.
export const moveItem = (item, target) => {
  return (dispatch, getState) => {
    const id_name = getItemIdName(item);
    const parent_id_name = getItemParentIdName(item);
    const target_id = target[getItemIdName(target)];
    const data = {
      [id_name]: item[id_name],
      [parent_id_name]: target_id,
    };
    return apiCallItemMethod(dispatch, 'move', {type: item.type}, data)
      .then(() => {
        if (target.type == 'group') {
          dispatch(loadGroupItems(item[parent_id_name]));
          dispatch(loadGroupItems(target_id));
        }
      })
  };
}


export const loadIcmpEventsLast = () => {
  return (dispatch, getState) => {
    return new Promise((resolve, reject) => {
      webapi.call('icmp_get_events_last')
        .then(response => {
            if (response.data.success) {
              const state = getState();
              const { hosts } = state.data;
              const events = response.data.result.events;
              let unloaded_hosts = [];

              for (let i = 0; i < events.length; i++) {
                let e = events[i];
                if (!hosts[e.host_id]) {
                  unloaded_hosts.push(e.host_id);
                }
              }
              if (unloaded_hosts.length > 0) {
                dispatch(loadHostsBatch(unloaded_hosts));
              }

              dispatch(dataEventsListUpdate({list: events, time: new Date()}));
              resolve(response.data);
            } else {
              dispatch(errorsAddMessage(response.data.error));
              reject(response.data);
            }
        })
        .catch(error => {
          dispatch(errorsAddMessage(error));
          reject({success: false, error});
        })
    });
  };
}


// Загрузить сразу пачку хостов по списку их id
export const loadHostsBatch = (ids) => {
  return (dispatch, getState) => {
    return new Promise((resolve, reject) => {
      webapi.call('host_get_batch', {ids})
        .then(response => {
            if (response.data.success) {
              dispatch(dataGroupUpdate(response.data.result.groups))
              dispatch(dataHostUpdate(response.data.result.hosts))
              resolve(response.data);
            } else {
              dispatch(errorsAddMessage(response.data.error));
              reject(response.data);
            }
        })
        .catch(error => {
          dispatch(errorsAddMessage(error));
          reject({success: false, error});
        })
    });
  };
}

export const loadGroupsBatch = (ids) => {
  return (dispatch, getState) => {
    return new Promise((resolve, reject) => {
      webapi.call('group_get_batch', {ids})
        .then(response => {
            if (response.data.success) {
              dispatch(dataGroupUpdate(response.data.result.groups))
              resolve(response.data);
            } else {
              dispatch(errorsAddMessage(response.data.error));
              reject(response.data);
            }
        })
        .catch(error => {
          dispatch(errorsAddMessage(error));
          reject({success: false, error});
        })
    });
  };
}


export const loadSearchResults = (query) => {
  return (dispatch, getState) => {
    dispatch(dataSearchQuerySet(query));
    if (query.length == 0) {
      dispatch(dataSearchResultsSet([]));
      dispatch(dataSearchFetchingSet(false));
      return;
    }
    dispatch(dataSearchFetchingSet(true));
    setTimeout(() => {
      const state = getState();
      const q = query.trim();

      if (state.data.search.query == q && q.length >= 3) {
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
                    if (!state.data.groups[r.group_id]) {
                      unloaded_groups.push(r.group_id);
                    }
                    break;
                  case 'host':
                    if (!state.data.hosts[r.host_id]) {
                      unloaded_hosts.push(r.host_id);
                    }
                }
              }
              if (unloaded_groups.length > 0) {
                dispatch(loadGroupsBatch(unloaded_groups));
              }
              if (unloaded_hosts.length > 0) {
                dispatch(loadHostsBatch(unloaded_hosts));
              }
              dispatch(dataSearchResultsSet(result));
              dispatch(dataSearchFetchingSet(false));
            } else {
              dispatch(errorsAddMessage(response.data.error));
              dispatch(dataSearchFetchingSet(false));
            }
          })
          .catch(error => {
            dispatch(errorsAddMessage(error));
          })
      }
    }, 500);
  };
}

export const loadEventsArchive = () => {
  return (dispatch, getState) => {
    const state = getState();
    const { start_time, end_time } = state.data.events_archive;

    if (!(start_time && end_time)) {
      console.log('no range');
      return;
    }
    if (!start_time._isAMomentObject) {
      return;
    }

    if (!end_time._isAMomentObject) {
      return;
    }

    const params = {
      start_time: moment(start_time).format('X'),
      end_time: moment(end_time).format('X'),
    }

    webapi.call('events_archive_get', params)
      .then(response => {
          if (response.data.success) {
            const state = getState();
            const { result } = response.data;

            let unloaded_hosts = [];
            for (let i = 0; i < result.length; i++) {
              let r = result[i];

              if (!state.data.hosts[r.host_id]) {
                unloaded_hosts.push(r.host_id);
              }
            }
            if (unloaded_hosts.length > 0) {
              dispatch(loadHostsBatch(unloaded_hosts));
            }

            dispatch(dataEventsArchiveItemsSet(result));
          } else {
            dispatch(errorsAddMessage(response.data.error));
          }
      })
      .catch(error => {
        dispatch(errorsAddMessage(error));
      })
  }
}

function saveItem(dispatch, type, data) {
  return apiCallItemMethod(dispatch, 'save', {type}, data);
}

function deleteItem(item, dispatch) {
  const id_name = getItemIdName(item);
  const params = {[id_name]: item[id_name]}

  return apiCallItemMethod(dispatch, 'delete', item, params);
}

function apiMoveItem(dispatch, type, data) {
  return apiCallItemMethod(dispatch, 'move', {type}, data);
}


function apiCallItemMethod(dispatch, method, item, params) {
  const api_method = `${item.type}_${method}`;

  return new Promise((resolve, reject) => {
    webapi.call(api_method, params)
      .then(response => {
          if (response.data.success) {
            resolve(response.data);
          } else {
            dispatch(errorsAddMessage(response.data.error));
            reject(response.data);
          }
      })
      .catch(error => {
        dispatch(errorsAddMessage(error));
        reject({success: false, error});
      })
  });
}

export const dataEventsListUpdate = createAction('DATA_EVENTS_LIST_UPDATE');
export const dataEventsFetchPeriodSet = createAction('DATA_EVENTS_FETCH_PERIOD_SET');
export const dataEventsFilterTypeSet = createAction('DATA_EVENTS_FILTER_TYPE_SET');
export const dataEventsFilterAddrSet = createAction('DATA_EVENTS_FILTER_ADDR_SET');

export const dataSearchQuerySet = createAction('DATA_SEARCH_QUERY_SET');
export const dataSearchResultsSet = createAction('DATA_SEARCH_RESULTS_SET');
export const dataSearchFetchingSet = createAction('DATA_SEARCH_FETCHING_SET');

export const dataEventsArchiveItemsSet = createAction('DATA_EVENTS_ARCHIVE_ITEMS_SET');
export const dataEventsArchiveStartTimeSet = createAction('DATA_EVENTS_ARCHIVE_START_TIME_SET');
export const dataEventsArchiveEndTimeSet = createAction('DATA_EVENTS_ARCHIVE_END_TIME_SET');
