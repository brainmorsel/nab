import { createAction } from 'redux-actions';
import moment from 'moment';
import * as webapi from 'webapi';

import * as app from 'app/actions';
import * as cmdb from 'app/cmdb/actions';
import * as cmdbSelectors from 'app/cmdb/selectors';


export const problemHostsUpdate = createAction('EVENTS_PROBLEM_HOSTS_UPDATE');
export const problemHostsFetchPeriodSet = createAction('EVENTS_PROBLEM_HOSTS_FETCH_PERIOD_SET');

export const loadProblemHosts = () => {
  return (dispatch, getState) => {
    return webapi.call('events_problem_hosts_get')
      .then(response => {
        if (response.data.success) {
          const { result } = response.data;
          const hosts = cmdbSelectors.hosts(getState());
          const unloaded_hosts = result
            .map(i => i.host_id)
            .filter(host_id => !hosts[host_id]);
          if (unloaded_hosts.length > 0) {
            return dispatch(cmdb.loadHosts(unloaded_hosts)).then(() => {
              dispatch(problemHostsUpdate(result));
            });
          } else {
            dispatch(problemHostsUpdate(result));
          }
        } else {
          dispatch(app.errorsAddMessage(response.data.error));
        }
      })
      .catch(error => {
        dispatch(app.errorsAddMessage(error));
      })
  };
}
