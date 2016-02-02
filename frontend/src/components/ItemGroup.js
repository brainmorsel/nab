import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';

import GroupBreadcrumbs from './GroupBreadcrumbs.js';
import FormButtonConfirm from './FormButtonConfirm.js';
import GroupLabel from './GroupLabel.js';

import urls from '../urls';
import { Link } from 'react-router';


const groupsSelector = state => state.data.groups;
const groupIdSelector = (state, props) => props.params.group_id;
const groupTypesSelector = state => state.data.group_types;
const hostTypesSelector = state => state.data.host_types;
const itemsSelector = createSelector(
  groupsSelector,
  groupIdSelector,
  groupTypesSelector,
  hostTypesSelector,
  (groups, group_id, groupTypes, hostTypes) => {
    return {
      groups,
      group_id,
      item: groups[group_id],
      groupTypes,
      hostTypes,
    }
  }
);

function mapActionsToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

@connect(itemsSelector, mapActionsToProps)
export default class ItemGroup extends Component {
  componentDidMount() {
    const { group_id, item, actions: { loadGroupsBatch } } = this.props;
    if (!item) {
      loadGroupsBatch([group_id, ])
        .catch(e => { console.log('ERROR:', e) });
    }
  }

  renderChildren(item) {
    return React.Children.map(
      this.props.children,
      child => React.cloneElement(child, {
        actions: this.props.actions,
        navigate: this.props.navigate,
        groupTypes: this.props.groupTypes,
        hostTypes: this.props.hostTypes,
        item: item,
      })
    );
  }

  handleDelete() {
    const { item, navigate } = this.props;
    const { deleteGroup } = this.props.actions;

    deleteGroup(item)
      .then(() => {
        navigate(urls.group.show(item.parent_id));
      })
  }

  render() {
    const { group_id, item } = this.props;

    return (
      item
        ? <div>
            <GroupBreadcrumbs group_id={item.parent_id}>
              <GroupLabel group={item}/>
            </GroupBreadcrumbs>
            <div>
              <Link className='button' to={urls.group.show(item.group_id)}>Show</Link>
              <Link className='button' to={urls.group.edit(item.group_id)}>Edit</Link>
              <Link className='button' to={urls.group.move(item.group_id)}>Move</Link>
              <Link className='button' to={urls.group.create(item.group_id)}>Create group</Link>
              <Link className='button' to={urls.host.create(item.group_id)}>Create host</Link>
              <FormButtonConfirm onClick={this.handleDelete.bind(this)}>Delete</FormButtonConfirm>
            </div>
            {this.renderChildren(item)}
          </div>
        : <div>Loading...</div>
    );
  }
}
