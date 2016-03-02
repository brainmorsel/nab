import { combineReducers } from 'redux';
import { handleAction, handleActions } from 'redux-actions';
import u from 'updeep';

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

import cmdb from './cmdb/reducers';
import events from './events/reducers';
export default combineReducers({
  errors,
  cmdb,
  events,
});
