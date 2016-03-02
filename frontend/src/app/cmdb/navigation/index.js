import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { pushPath } from 'redux-simple-router';
import { Route, IndexRoute } from 'react-router';
import { createSelector } from 'reselect';

import * as selectors from 'app/cmdb/selectors';
import * as actions from 'app/cmdb/actions';
import * as searchSelectors from './search/selectors';

import urls from 'app/urls';
import { View } from 'ui/layout.js';
import { Tree } from './tree';
import { TreeItemGroup } from './tree/item-group';
import { TreeItemNetwork } from './tree/item-network';
import { TreeItemSimpleList } from './tree/item-simplelist';
import { GroupTypeLabel } from 'app/cmdb/group-type/label';
import { HostTypeLabel } from 'app/cmdb/host-type/label';
import { SearchField, SearchResults } from './search';


function mapActionsToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
    navigate: bindActionCreators(pushPath, dispatch),
  };
}

const selector = createSelector(
  selectors.rootGroups,
  selectors.rootNetworks,
  selectors.groupTypesList,
  selectors.hostTypesList,
  selectors.clientTypesList,
  searchSelectors.searchQuery,
  (rootGroups, rootNetworks, groupTypesList, hostTypesList, clientTypesList, searchQuery) => {
    return {
      rootGroups,
      rootNetworks,
      groupTypesList,
      hostTypesList,
      clientTypesList,
      searchQuery,
    }
  }
);

@connect(selector, mapActionsToProps)
export class Navigation extends Component {
  navigateTo(item) {
    console.log('CLICK', item);
    if (item && item.type == 'group') {
      this.props.navigate(urls.cmdb.group.show(item.group_id));
    }
  }

  render() {
    const { rootGroups, rootNetworks, groupTypesList, hostTypesList, clientTypesList, searchQuery, actions, ...other } = this.props;

    return (
      <View {...other} layout='vertical'>
        <View height={25} style={{fontSize: '25px'}}>
          <SearchField />
        </View>
        <View height={5} ></View>
        { searchQuery.length > 0 && <View><SearchResults /></View> }
        { searchQuery.length > 0 && <View height={10} style={{backgroundColor: '#888'}}></View> }
        <View style={{overflowY: 'scroll'}}>
          <Tree>
            <TreeItemGroup
              withLinks
              onClick={this.navigateTo.bind(this)}
              group={{name: 'Хосты', children: rootGroups}}
              />
            <TreeItemNetwork network={{name: 'Сети', children: rootNetworks}} />
            <TreeItemSimpleList
              label='Типы групп'
              loadData={actions.loadGroupTypes}
              children={groupTypesList}
              childLabelComponent={(props) => <GroupTypeLabel {...props} isLink />}/>
            <TreeItemSimpleList
              label='Типы хостов'
              loadData={actions.loadHostTypes}
              children={hostTypesList}
              childLabelComponent={(props) => <HostTypeLabel {...props} isLink />}/>
            <TreeItemSimpleList
              label='Типы клиентов'
              loadData={actions.loadClientTypes}
              children={clientTypesList}
              childLabelComponent={(props) => <span>{props.item.name}</span>}/>
          </Tree>
        </View>
      </View>
    );
  }
}
