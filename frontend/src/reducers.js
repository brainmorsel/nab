import { handleAction, handleActions } from 'redux-actions';
import u from 'updeep';

function isArray(obj) {
  const what = Object.prototype.toString;

  return what.call(obj) == '[object Array]';
}

export const globalSpinner = handleActions({
    GLOBAL_SPINNER_JOB_START: (state, action) => {
        const runningJobs = state.runningJobs + 1;
        return {
            ...state,
            runningJobs,
            isRunning: (runningJobs != 0)
        };
    },
    GLOBAL_SPINNER_JOB_SUCCESS: (state, action) => {
        const runningJobs = state.runningJobs - 1;
        return {
            ...state,
            runningJobs,
            isRunning: (runningJobs != 0)
        };
    },
    GLOBAL_SPINNER_JOB_FAIL: (state, action) => {
        const runningJobs = state.runningJobs - 1;
        return {
            ...state,
            runningJobs,
            isRunning: (runningJobs != 0)
        };
    }
},{isRunning: false, runningJobs: 0});

/* рабочие данные приложения */
export const data = handleActions({
    DATA_HOST_UPDATE: (state, action) => {
        const hostData = action.payload;

        if (isArray(hostData)) {
          return u({
            hosts: u_array_to_obj('host_id', hostData)
          }, state);
        } else {
          return u({
            hosts: {
                [hostData.host_id]: hostData
            }
          }, state);
        }
    },
    DATA_GROUP_UPDATE: (state, action) => {
        const groupData = action.payload;

        if (isArray(groupData)) {
          return u({
            groups: u_array_to_obj('group_id', groupData)
          }, state);
        } else {
          return u({
            groups: {
                [groupData.group_id]: groupData
            }
          }, state);
        }
    },
    DATA_NETWORK_UPDATE: (state, action) => {
        const data = action.payload;
        return u({
            networks: {
                [data.network_id]: data
            }
        }, state);
    },
    DATA_HOST_IP_UPDATE: (state, action) => {
        const data = action.payload;
        return u({
            host_ips: {
                [data.ip_id]: data
            }
        }, state);
    },
    DATA_HOST_MAC_UPDATE: (state, action) => {
        const data = action.payload;
        return u({
            host_macs: {
                [data.mac_id]: data
            }
        }, state);
    },
    DATA_GROUP_UPDATE_CHILDREN: (state, action) => {
        const { group_id, children, sideload } = action.payload;
        const groups = u_array_to_obj(
            'group_id',
            sideload
              .filter(i => i.type == 'group')
              .concat([{
                group_id,
                children
              }])
        );
        const hosts = u_array_to_obj('host_id', sideload.filter(i => i.type == 'host'));
        return u({
          groups,
          hosts,
        }, state);
    },
    DATA_NETWORK_UPDATE_CHILDREN: (state, action) => {
        const { network_id, children } = action.payload;
        return u({
            networks: {
                [network_id]: {
                    children
                }
            }
        }, state);
    },
    DATA_HOST_UPDATE_IPS: (state, action) => {
        const { host_id, ips } = action.payload;
        return u({
            hosts: {
                [host_id]: {
                    ips
                }
            }
        }, state);
    },
    DATA_HOST_UPDATE_MACS: (state, action) => {
        const { host_id, macs } = action.payload;
        return u({
            hosts: {
                [host_id]: {
                    macs
                }
            }
        }, state);
    },
    MENU_GROUPS_UPDATE_CHILDREN: (state, action) => {
        const { children, sideload } = action.payload;
        return u({
          menu: {
            groups: children
          },
          groups: u_array_to_obj('group_id', sideload.filter(i => i.type == 'group'))
        }, state);
    },
    MENU_NETWORKS_UPDATE_CHILDREN: (state, action) => {
        const { children } = action.payload;
        return u({
            menu: {
                networks: children
            }
        }, state);
    },
    DATA_GROUP_TYPE_UPDATE_ALL: (state, action) => {
        const items = action.payload;
        return u({
          group_types: u_array_to_obj('group_type_id', items)
        }, state);
    },
    DATA_HOST_TYPE_UPDATE_ALL: (state, action) => {
        const items = action.payload;
        return u({
          host_types: u_array_to_obj('host_type_id', items)
        }, state);
    },
    DATA_NETWORKS_ALL_UPDATE_START: (state, action) => {
        return u({
          networks_all_loading: true,
        }, state);
    },
    DATA_NETWORKS_ALL_UPDATE: (state, action) => {
        const ids = action.payload;
        return u({
          networks_all_loading: false,
          networks_all: ids
        }, state);
    },

  DATA_EVENTS_LIST_UPDATE: (state, action) => {
    const { list, time } = action.payload;

    return u({
      events: {list, lastUpdate: time}
    }, state);
  },
  DATA_EVENTS_FETCH_PERIOD_SET: (state, action) => {
    return u({
      events: {fetchPeriod: action.payload}
    }, state);
  },
  DATA_EVENTS_FILTER_TYPE_SET: (state, action) => {
    return u({
      events: {filterType: action.payload}
    }, state);
  },
  DATA_EVENTS_FILTER_ADDR_SET: (state, action) => {
    return u({
      events: {filterAddr: action.payload}
    }, state);
  },
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
    return u({
      search: {fetching: action.payload}
    }, state);
  },
}, {
  menu: {
    groups: [],
    networks: [],
  },
  hosts: {},
  groups: {},
  group_types: {},
  host_types: {},
  networks: {},
  host_ips: {},
  host_macs: {},
  networks_all: [],  // list of IDs of all networks
  networks_all_loading: false,
  events: {
    list: [],
    lastUpdate: null,
    fetchPeriod: 60,
    filterType: 'all',
    filterAddr: '',
  },
  search: {
    fetching: false,
    query: '',
    results: [],
  }
});

function u_array_to_obj (key, items, extra = {}) {
    let obj = {};
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        obj[item[key]] = {...item, ...extra};
    }
    return obj;
}


export const fetcher = handleActions({
  FETCHER_FETCHING_START: (state, action) => {
      const {type, id} = action.payload;
      return u({
        fetching_now: {[type]: {[id]: {r: true} }}
      }, state);
  },
  FETCHER_FETCHING_DONE: (state, action) => {
      const {type, id} = action.payload;
      return u({
        fetching_now: {[type]: {[id]: {r: false} }}
      }, state);
  },
}, {
  fetching_now: {},
});

export const errors = handleActions({
  ERRORS_ADD_MESSAGE: (state, action) => {
      const msg = action.payload;

      return u({
        messages: list => [].concat(list, [msg])
      }, state);
  },
  ERRORS_CLEAR: (state, action) => {
      return u({
        messages: [],
      }, state);
  },
}, {
  messages: [],
});
