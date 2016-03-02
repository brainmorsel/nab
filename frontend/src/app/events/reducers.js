import { combineReducers } from 'redux';
import { handleAction, handleActions } from 'redux-actions';
import u from 'updeep';
import { u_array_to_obj, u_one_or_more, u_payload_to_field } from 'app/util';



const problem_hosts = handleActions({
  EVENTS_PROBLEM_HOSTS_UPDATE: u_payload_to_field('list'),
  EVENTS_PROBLEM_HOSTS_FETCH_PERIOD_SET: u_payload_to_field('fetch_period'),
}, {
  list: [],
  fetch_period: 30,
});

export default combineReducers({
  problem_hosts
});
