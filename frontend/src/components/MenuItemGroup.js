import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';

import MenuItem from './MenuItem';
import Icon from './Icon.js';
import GroupLabel from './GroupLabel.js';
import HostLabel from './HostLabel.js';


const hostsSelector = state => state.data.hosts;
const groupsSelector = state => state.data.groups;
const groupIdSelector = (state, props) => props.group_id;
const propsGroupSelector = (state, props) => props.group;
const itemsSelector = createSelector(
  hostsSelector,
  groupsSelector,
  groupIdSelector,
  propsGroupSelector,
  (hosts, groups, group_id, propsGroup) => {
    const group = groups[group_id] || propsGroup;
    const children = (group || {}).children;
    return {
      hosts,
      groups,
      group_id,
      group,
      children,
    }
  }
);

function mapActionsToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

@connect(itemsSelector, mapActionsToProps)
export default class MenuItemGroup extends Component {
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
    const { actions: { loadGroupItems }, group_id } = this.props;

    if (!this.state.isFetching) {
      this.setState({isFetching: true});
      loadGroupItems(group_id).then(() => {
        this.setState({isFetching: false});
      });
    }
  }

  handleClick() {
    const { onClick, group_id } = this.props;

    if (!this.state.isOpen) {
      this.handleToggle();
    }
  }

  render() {
    const { isOpen, isFetching } = this.state;
    const { children, group, groups, hosts } = this.props;
    const curItem = group;

    const hoverButtons = [
      <Icon key='reload' fixedWidth name='refresh' onClick={this.handleReload.bind(this)} className='reload' title='Обновить'/>
    ];

    return (
      <MenuItem
        label={<GroupLabel isLink group={curItem}/>}
        title={curItem.group_type_name}
        canHasChildren
        isOpen={isOpen}
        isFetching={isFetching}
        onToggle={this.handleToggle.bind(this)}
        onClick={this.handleClick.bind(this)}
        hoverButtons={hoverButtons}
        >
            { children && children.length > 0
                ? children.map(item => (()=>{
                  switch (item.type) {
                    case 'group': {
                      let {group_id, name} = groups[item.group_id];
                      return <MenuItemGroup key={`group${group_id}`} group_id={group_id} />
                    }
                    case 'host': {
                      let host = hosts[item.host_id];
                      return (
                        <MenuItem
                          label={<HostLabel isLink host={host}/>}
                          key={`host${host.host_id}`}
                          />
                      );
                    }
                  }
                })())
                : <li>{isFetching ? 'Загрузка...' : 'Пока ничего нет.'}</li>
            }
      </MenuItem>
    );
  }
}
