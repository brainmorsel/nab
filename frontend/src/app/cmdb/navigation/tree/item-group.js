import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';

import * as selectors from 'app/cmdb/selectors';
import * as actions from 'app/cmdb/actions';

import { TreeItem } from './item';
import Icon from 'ui/widgets/icon';
import { GroupLabel } from 'app/cmdb/group/label';
import { HostLabel } from 'app/cmdb/host/label';
import { GroupBreadcrumbs } from 'app/cmdb/group/breadcrumbs';


const groupSelector = (state, props) => props.group;
const itemsSelector = createSelector(
  selectors.hosts,
  selectors.groups,
  groupSelector,
  selectors.currentGroupPath,
  (hosts, groups, group, currentPath) => {
    const children = (group || {}).children;
    return {
      hosts,
      groups,
      group,
      children,
      currentPath,
    }
  }
);

function mapActionsToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

@connect(itemsSelector, mapActionsToProps)
export class TreeItemGroup extends Component {
  static defaultProps = {
    onClick: () => {},
  }

  constructor(props) {
    super(props);
    this.state = {isOpen: false, isFetching: false, inPath: false};
  }

  componentDidMount() {
    this.checkPath(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.checkPath(nextProps);
  }

  checkPath(props) {
    const { group, currentPath, children, selectMode } = props;

    if (-1 !== currentPath.indexOf(group.group_id) || (!group.group_id && currentPath.length)) {
      this.setState({isOpen: true, inPath: true});
      if (!children || children.length == 0) {
        this.handleReload()
      }
    } else {
      this.setState({inPath: false});
      //if (!selectMode && group.group_id) {
      //  this.setState({isOpen: false});
      //}
    }
  }

  handleToggle() {
    if (!this.state.isOpen) {
      this.handleReload();
    }
    this.setState({isOpen: !this.state.isOpen});
  }

  handleReload() {
    const { actions: { loadGroupChildren }, group } = this.props;

    if (!this.state.isFetching) {
      this.setState({isFetching: true});
      loadGroupChildren(group.group_id).then(() => {
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
    const { isOpen, isFetching, inPath } = this.state;
    const { children, group, groups, hosts, selectMode, selectedGroup, withLinks, onClick, label, withBreadcrumbs } = this.props;
    const isSelected = selectedGroup && selectedGroup.group_id == group.group_id;

    const hoverButtons = [
      <Icon key='reload' fixedWidth name='refresh' onClick={this.handleReload.bind(this)} title='Обновить'/>
    ];

    const _label = withBreadcrumbs
      ? <GroupBreadcrumbs group_id={group.parent_id}>{label || <GroupLabel isLink={withLinks} item={group}/>}</GroupBreadcrumbs>
      : label || <GroupLabel isLink={withLinks} item={group}/>
    ;

    return (
      <TreeItem
        label={_label}
        title={group.group_type_name}
        canHasChildren
        isOpen={isOpen}
        isFetching={isFetching}
        onToggle={this.handleToggle.bind(this)}
        onClick={this.handleClick.bind(this)}
        hoverButtons={hoverButtons}
        isSelected={isSelected}
        isCurrent={inPath}
        >
          { children && children.length > 0
              ? children.map(item => (()=>{
                switch (item.type) {
                  case 'group': {
                    let grp = groups[item.group_id];
                    return (
                      <TreeItemGroup
                        key={`group${item.group_id}`}
                        group={grp}
                        withLinks={withLinks}
                        onClick={onClick}
                        selectMode={selectMode}
                        selectedGroup={selectedGroup}
                        />
                    );
                  }
                  case 'host': {
                    let host = hosts[item.host_id];
                    return (
                      <TreeItem
                        label={<HostLabel isLink={withLinks} item={host}/>}
                        key={`host${host.host_id}`}
                        onClick={onClick}
                        />
                    );
                  }
                }
              })())
              : <li>{isFetching ? 'Загрузка...' : 'Пока ничего нет.'}</li>
          }
      </TreeItem>
    );
  }
}
