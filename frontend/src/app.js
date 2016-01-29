import 'babel-core/polyfill';

import React from 'react';
import { Provider } from 'react-redux';
import { render } from 'react-dom';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { Router, Route, IndexRoute } from 'react-router';
import { createHistory, createHashHistory } from 'history';
import { syncReduxAndRouter, routeReducer } from 'redux-simple-router';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import { reducer as formReducer } from 'redux-form';

import App from './components/App';
import ItemGroupShowRoot from './components/ItemGroupShowRoot';
import ItemGroup from './components/ItemGroup';
import ItemGroupShow from './components/ItemGroupShow';
import ItemGroupEdit from './components/ItemGroupEdit';
import ItemGroupCreate from './components/ItemGroupCreate';
import ItemGroupMove from './components/ItemGroupMove';
import ItemHost from './components/ItemHost';
import ItemHostShow from './components/ItemHostShow';
import ItemHostEdit from './components/ItemHostEdit';
import ItemHostCreate from './components/ItemHostCreate';
import ItemGroupTypeEdit from './components/ItemGroupTypeEdit';
import ItemGroupTypeCreate from './components/ItemGroupTypeCreate';
import ItemHostTypeEdit from './components/ItemHostTypeEdit';
import ItemHostTypeCreate from './components/ItemHostTypeCreate';
import ItemNetwork from './components/ItemNetwork';
import ItemNetworkShow from './components/ItemNetworkShow';
import ItemNetworkEdit from './components/ItemNetworkEdit';
import ItemNetworkCreate from './components/ItemNetworkCreate';
import ItemNetworkShowRoot from './components/ItemNetworkShowRoot';
import EventList from './components/EventList';
import EventArchive from './components/EventArchive';

import * as reducers from './reducers';
import * as actions from './actions';
import urls from './urls';

import 'moment/locale/ru';

const logger = createLogger();
const finalCreateStore = applyMiddleware(
         thunk
//        ,logger
)(createStore);
const reducer = combineReducers({
    ...reducers,
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
      <Route path={urls.prefix} component={App}>
        <Route path="events">
          <IndexRoute component={EventList}/>
          <Route path="archive" component={EventArchive}/>
          <Route path="archive/host/:host_id" component={EventArchive}/>
        </Route>
        <Route path="group" component={ItemGroupShowRoot}/>
        <Route path="group/new" component={ItemGroupCreate}/>
        <Route path="group/:group_id" component={ItemGroup}>
          <IndexRoute component={ItemGroupShow} />
          <Route path="edit" component={ItemGroupEdit}/>
          <Route path="new-group" component={ItemGroupCreate}/>
          <Route path="new-host" component={ItemHostCreate}/>
          <Route path="move" component={ItemGroupMove}/>
        </Route>
        <Route path="host/:host_id" component={ItemHost}>
          <IndexRoute component={ItemHostShow} />
          <Route path="edit" component={ItemHostEdit}/>
          <Route path="move" component={ItemGroupMove}/>
        </Route>
        <Route path="network" component={ItemNetworkShowRoot} />
        <Route path="network/new" component={ItemNetworkCreate} />
        <Route path="network/:network_id" component={ItemNetwork}>
          <IndexRoute component={ItemNetworkShow} />
          <Route path="edit" component={ItemNetworkEdit}/>
          <Route path="new" component={ItemNetworkCreate}/>
        </Route>
        <Route path="group_type/create" component={ItemGroupTypeCreate} />
        <Route path="group_type/:group_type_id" component={ItemGroupTypeEdit} />
        <Route path="host_type/create" component={ItemHostTypeCreate} />
        <Route path="host_type/:host_type_id" component={ItemHostTypeEdit} />
      </Route>
    </Router>
  </Provider>,
  rootElement
);

import * as webapi from './webapi';

//webapi.call('icmp_get_events_last').then(console.log.bind(console))
