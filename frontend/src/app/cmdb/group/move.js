import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { pushPath } from 'redux-simple-router';
import { Route, IndexRoute } from 'react-router';
import { createSelector } from 'reselect';

import * as cmdbSelectors from 'app/cmdb/selectors';
import * as hostSelectors from 'app/cmdb/host/selectors';
import * as selectors from './selectors';
import * as actions from 'app/cmdb/actions';

import { View } from 'ui/layout';
import { Tree } from 'app/cmdb/navigation/tree';
import { TreeItemGroup } from 'app/cmdb/navigation/tree/item-group';
import { GroupLabel } from './label';
import { Button } from 'ui/form';


function mapActionsToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

const selector = createSelector(
  selectors.currentGroup,
  hostSelectors.currentHost,
  cmdbSelectors.rootGroups,
  cmdbSelectors.groups,
  (group, host, rootGroups, groups) => {
    return {
      group,
      host,
      rootGroups,
      groups,
    }
  }
);

@connect(selector, mapActionsToProps)
export class GroupMove extends Component {
  constructor(props) {
    super(props);
    this.state = {selectedGroup: undefined};
  }

  handleSelect(item) {
    const { group, groups } = this.props;

    if (item && item.type == 'group') {
      const path_ids = [];
      let cur = item;
      while (cur) {
        path_ids.push(cur.group_id);
        cur = groups[cur.parent_id];
      }

      // нельзя выделить группу, которая внутри той, что мы перемещаем
      if (!(group && -1 != path_ids.indexOf(group.group_id))) {
        this.setState({selectedGroup: item});
      }
    }
  }

  handleMove() {
    const { selectedGroup } = this.state;
    const { group, host,  actions: { moveItem, loadGroupChildren } } = this.props;
    if (group) {
      moveItem(group, selectedGroup)
        .then(() => {
          loadGroupChildren(selectedGroup.group_id);
          loadGroupChildren(group.parent_id);
        })
    }
    if (host) {
      moveItem(host, selectedGroup)
        .then(() => {
          loadGroupChildren(selectedGroup.group_id);
          loadGroupChildren(host.group_id);
        })
    }
  }

  render() {
    const { group, rootGroups, ...other } = this.props;
    const { selectedGroup } = this.state;

    return (
      <View layout='vertical' {...other}>
        <View height={25}>
          <div>
            <Button disabled={!selectedGroup} onClick={this.handleMove.bind(this)}>Move</Button> to
            { selectedGroup && <GroupLabel item={selectedGroup}/> }
          </div>
        </View>
        <View style={{overflowY: 'scroll'}}>
          <Tree>
            <TreeItemGroup
              group={{name: 'Хосты', children: rootGroups}}
              selectMode
              selectedGroup={selectedGroup}
              onClick={this.handleSelect.bind(this)}
              />
          </Tree>
        </View>
      </View>
    );
  }
}

