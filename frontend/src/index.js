import 'babel-core/polyfill';

import React from 'react';
import { Provider } from 'react-redux';
import { render } from 'react-dom';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { Router } from 'react-router';
import { createHistory, createHashHistory } from 'history';
import { syncReduxAndRouter, routeReducer } from 'redux-simple-router';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import { reducer as formReducer } from 'redux-form';

import { route } from 'app';
import appReducer from 'app/reducers';

import 'moment/locale/ru';

const logger = createLogger();
const finalCreateStore = applyMiddleware(
         thunk
//        ,logger
)(createStore);
const reducer = combineReducers({
  app: appReducer,
  routing: routeReducer,
  form: formReducer,
});
const store = finalCreateStore(reducer);
const history = createHashHistory({
  queryKey: false
});

syncReduxAndRouter(history, store);

window.getState = () => store.getState();

console.log('PRODUCTION', PRODUCTION);

let rootElement = document.getElementById('root');
render(
  <Provider store={store}>
    <Router history={history}>
      { route() }
    </Router>
  </Provider>,
  rootElement
);

import * as webapi from './webapi';

//webapi.call('icmp_get_events_last').then(console.log.bind(console))
