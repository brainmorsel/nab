import './App.css';
import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import * as actions from '../actions';
import { bindActionCreators } from 'redux';
import { pushPath } from 'redux-simple-router'
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import urls from '../urls';

import MenuItemGroup from './MenuItemGroup.js';
import MenuItemGroupTypes from './MenuItemGroupTypes.js';
import MenuItemHostTypes from './MenuItemHostTypes.js';
import MenuItemNetwork from './MenuItemNetwork.js';
import FormButton from './FormButton';
import SearchField from './SearchField.js';
import SearchResults from './SearchResults.js';


// Which props do we want to inject, given the global state?
// Note: use https://github.com/faassen/reselect for better performance.
function mapState(state) {
  return {
    data: state.data,
    globalSpinner: state.globalSpinner,
    errors: state.errors,
  };
}

function mapActionsToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
    navigate: bindActionCreators(pushPath, dispatch)
  };
}

@connect(mapState, mapActionsToProps)
@DragDropContext(HTML5Backend)
export default class App extends Component {
  getItemData(item) {
    /* Если необходимые данные уже есть, отдаём их, если нет, начинаем загрузку. */
    const { data } = this.props;
    let result;

    switch (item.type) {
      case 'group':
        if (item.group_id === undefined || item.group_id === null) {
          return;
        }
        result = data.groups[item.group_id];
        break;
      case 'host':
        if (item.host_id === undefined) {
          return;
        }
        result = data.hosts[item.host_id];
        break;
      case 'group_type':
        if (item.group_type_id === undefined) {
          return;
        }
        result = data.group_types[item.group_type_id];
        break;
      case 'host_type':
        if (item.host_type_id === undefined) {
          return;
        }
        result = data.host_types[item.host_type_id];
        break;
      case 'network':
        if (item.network_id === undefined) {
          return;
        }
        result = data.networks[item.network_id];
        break;
      case 'host_ip':
        if (item.ip_id === undefined) {
          return;
        }
        result = data.host_ips[item.ip_id];
        break;
      case 'host_mac':
        if (item.mac_id === undefined) {
          return;
        }
        result = data.host_macs[item.mac_id];
        break;
      case 'networks_all':
        return data.networks_all;
      default:
        return;
    }

    if (result === undefined) {
      // Загружаем данные в альтернативном потоке, чтобы можно было вызывать эту функцию из метода render.
      setTimeout(() => {
        this.props.actions.getItemDataAsync(item);
      }, 0);
    }

    return result;
  }

  renderChildren() {
    const { data } = this.props;

    return React.Children.map(
      this.props.children,
      child => React.cloneElement(child, {
        getItemData: this.getItemData.bind(this),
        actions: this.props.actions,
        navigate: this.props.navigate,
        groupTypes: data.group_types,
        data: data
      })
    );
  }

  render() {
    const { dispatch, data, globalSpinner, errors } = this.props;

    return (
      <div className='app-root'>
        <nav>
          <Link to={urls.home()}>Home</Link>
          <Link to={urls.events.show()}>Events</Link>
          <Link to={urls.events.archive()}>Events Archive</Link>
        </nav>

        <div className='app-wrap'>
        <main>
          <aside>
            <SearchField className='header'/>

            <div className='content'>
              <SearchResults style={{display: data.search.query.length > 0 ? '' : 'none'}} className='treemenu' />
              <ul style={{display: data.search.query.length > 0 ? 'none' : ''}} className='treemenu'>
                <MenuItemGroup
                  group={{name: 'Хосты', children: data.menu.groups}}
                  />
                <MenuItemNetwork
                  name='Сети'
                  iconName='folder'
                  items={data.menu.networks}
                  getItemData={this.getItemData.bind(this)}
                  loadNetworkItems={this.props.actions.loadNetworkItems}
                  />
                <MenuItemGroupTypes
                  name='Типы групп'
                  iconName='folder'
                  getData={this.props.actions.getGroupTypesAsync}
                  items={Object.keys(data.group_types).map(id => data.group_types[id])}
                  />
                <MenuItemHostTypes
                  name='Типы хостов'
                  iconName='folder'
                  getData={this.props.actions.getHostTypesAsync}
                  items={Object.keys(data.host_types).map(id => data.host_types[id])}
                  />
              </ul>
            </div>
          </aside>

          <article>
            {errors.messages.length > 0
              ? <div className='error-messages'>
                  {errors.messages.map((msg, i) => <div key={i}><b>Error:</b> {msg}</div>)}
                  <FormButton onClick={this.props.actions.errorsClear}>Clear</FormButton> 
                </div>
              : ''}
            {this.renderChildren() || <div>Home page.</div>}
          </article>
        </main>
        </div>
      </div>
    );
  }
}
