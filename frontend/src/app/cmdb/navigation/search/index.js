import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';

import * as cmdbSelectors from 'app/cmdb/selectors';
import * as selectors from './selectors';
import * as actions from 'app/cmdb/actions';

import styles from './index.css';
import urls from 'app/urls';
import { View } from 'ui/layout.js';
import Icon from 'ui/widgets/icon';
import { GroupBreadcrumbs } from 'app/cmdb/group/breadcrumbs';
import { GroupLabel } from 'app/cmdb/group/label';
import { HostLabel } from 'app/cmdb/host/label';
import { Tree } from '../tree';
import { TreeItemGroup } from '../tree/item-group';


function mapActionsToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

const selector = createSelector(
  selectors.searchQuery,
  selectors.searchFetching,
  selectors.searchResults,
  cmdbSelectors.groups,
  cmdbSelectors.hosts,
  (query, fetching, results, groups, hosts) => {
    return {
      query,
      fetching,
      results,
      groups,
      hosts,
    }
  }
);

@connect(selector, mapActionsToProps)
export class SearchField extends Component {
  handleQueryChange(e) {
    const { loadSearchResults } = this.props.actions;

    loadSearchResults(e.target.value);
  }

  handleQueryClear() {
    const { loadSearchResults } = this.props.actions;

    loadSearchResults('');
  }

  render() {
    const { actions, query, fetching, results, groups, hosts, ...other } = this.props;
    const showClearBtn = query.length > 0;

    return (
      <View {...other} layout='horizontal'>
        <div style={{height: '100%', display: 'flex', alignContent: 'center'}}>
          <Icon name={ fetching ? 'spinner' : 'search'} spin={fetching} fixedWidth/>
          <input style={{flex: '1', marginRight: '5px'}} type='text' placeholder='search...' value={query} onChange={this.handleQueryChange.bind(this)}/>
          <Icon
            name='times'
            fixedWidth
            style={{display: showClearBtn ? '' : 'none'}}
            onClick={this.handleQueryClear.bind(this)}
            />
        </div>
      </View>
    );
  }
}

@connect(selector, mapActionsToProps)
export class SearchResults extends Component {
  render() {
    const { actions, query, fetching, results, groups, hosts, ...other } = this.props;
    let msg;

    
    if (query.length < 3) {
      msg = 'Запрос должен быть не короче 3-х символов.'
    }

    if (results.length == 0) {
      msg = fetching ? 'Loading...' : 'Ничего не найдено.';
    }

    return (
      <View {...other} style={{overflowY: 'scroll'}}>
        <Tree>
          { msg
            ? <li>{ msg }</li>
            : results.map(r => {
              switch (r.type) {
                case 'host_ip':
                  {
                  const host = hosts[r.host_id];
                  return host && <li key={'host_ip'+r.ip_id}><GroupBreadcrumbs group_id={host.group_id}><HostLabel isLink item={host}/> (<Icon name='cloud' fixedWidth />{r.addr})</GroupBreadcrumbs></li>
                  }
                case 'host':
                  {
                  const host = hosts[r.host_id];
                  return host && <li key={'host'+r.host_id}><GroupBreadcrumbs group_id={host.group_id}><HostLabel isLink item={host}/></GroupBreadcrumbs></li>
                  }
                case 'group':
                  {
                  const group = groups[r.group_id];
                  return group && <TreeItemGroup key={'group'+r.group_id} group={group} withBreadcrumbs withLinks />
                  }
                case 'client':
                  {
                  const host = hosts[r.host_id];
                  return <li key={'client'+r.client_id}><Icon name='user' fixedWidth/>
                    {r.name} @ {host && <Link to={urls.cmdb.host.clients(r.host_id)}><HostLabel item={host}/> (port: {r.port_id} mac: {r.client_mac})</Link>}</li>
                  }
                case '_end_marker':
                  return <li key='_end_marker'>And {r.remaining_count} more results skipped...</li>
                default:
                  return '';
              }
            })
          }
        </Tree>
      </View>
    );
  }
}
