import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';

import MenuItem from './MenuItem';
import Icon from './Icon.js';
import GroupLabel from './GroupLabel.js';
import HostLabel from './HostLabel.js';


const groupsSelector = state => state.data.groups;
const rootGroupsSelector = state => state.data.menu.groups;

const itemsSelector = createSelector(
  groupsSelector,
  rootGroupsSelector,
  (groups, rootGroups) => {
    return {
      groups,
      rootGroups,
    }
  }
);

function mapActionsToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

@connect(itemsSelector, mapActionsToProps)
export default class GroupsTreeNavigator extends Component {
  componentDidMount() {
    this.props.actions.loadGroupItems();
  }

  render() {
    const { groups, rootGroups, actions: { loadGroupItems } } = this.props;
    const { selected, onSelect } = this.props;

    return (
      <div className='treemenu groups-tree-navigator'>
        <ul>
          {rootGroups.map(item => 
              <GroupItem
                key={item.group_id}
                group={groups[item.group_id]}
                groups={groups}
                loadGroupItems={loadGroupItems}
                onClick={onSelect}
                selected={selected}
                />)}
        </ul>
      </div>
    );
  }
}


class GroupItem extends Component {
  constructor(props) {
    super(props);
    this.state = {isOpen: false, isFetching: false};
  }

  componentDidMount() {
  }

  handleToggle() {
    if (!this.state.isOpen) {
      this.handleReload();
    }
    this.setState({isOpen: !this.state.isOpen});
  }

  handleReload() {
    const { loadGroupItems, group } = this.props;

    if (!this.state.isFetching) {
      this.setState({isFetching: true});
      loadGroupItems(group.group_id).then(() => {
        this.setState({isFetching: false});
      });
    }
  }

  handleClick() {
    const { onClick, group } = this.props;

    if (!this.state.isOpen) {
      this.handleToggle();
    }

    onClick(group);
  }

  render() {
    const { group, groups, selected } = this.props;
    const { isOpen, isFetching } = this.state;
    const items = (group.children || []).filter(i => i.type == 'group');
    const isSelected = selected && selected.group_id == group.group_id;

    const hoverButtons = [
      <Icon key='reload' fixedWidth name='refresh' onClick={this.handleReload.bind(this)} className='reload' title='Обновить'/>
    ];

    return (
      <MenuItem
        label={<GroupLabel group={group}/>}
        title={group.group_type_name}
        canHasChildren
        isOpen={isOpen}
        isFetching={isFetching}
        onToggle={this.handleToggle.bind(this)}
        onClick={this.handleClick.bind(this)}
        hoverButtons={hoverButtons}
        isSelected={isSelected}
        >
        { items.length > 0
            ? group.children.map(item => (()=>{
              switch (item.type) {
                case 'group':
                  let c_group = groups[item.group_id];
                  return <GroupItem {...this.props} key={`group${item.group_id}`} group={c_group}/>;
                default:
                  return '';
              }
            })())
            : <li>{isFetching ? 'Загрузка...' : 'Пока ничего нет.'}</li>
        }
      </MenuItem>
    );
  }
}
