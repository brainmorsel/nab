import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { pushPath } from 'redux-simple-router';
import { Route, IndexRoute } from 'react-router';
import { createSelector } from 'reselect';

import * as cmdbSelectors from 'app/cmdb/selectors';
import * as selectors from './selectors';
import * as actions from 'app/cmdb/actions';

import { View } from 'ui/layout';
import { GroupEditForm } from './edit-form';


function mapActionsToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

const createModeSelector = (state, props) => props.route.createMode;

const selector = createSelector(
  selectors.groupIdFromParams,
  selectors.currentGroup,
  cmdbSelectors.groupTypesList,
  createModeSelector,
  (group_id, group, groupTypesList, createMode) => {
    return {
      group_id,
      group,
      groupTypesList,
      createMode,
    }
  }
);

@connect(selector, mapActionsToProps)
export class GroupEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {isSaving: false, msg: ''};
  }

  componentDidMount() {
    const { groupTypesList, actions: { loadGroupTypes } } = this.props;

    if (!groupTypesList.length) {
      loadGroupTypes();
    }
  }

  handleSubmitSave(formData) {
    const { group, actions: { saveItem, loadGroups } } = this.props;
    const item = {
      ...group,
      ...formData,
    };
    this.setState({isSaving: true});
    saveItem(item)
      .then(result => {
        this.setState({isSaving: false});
        loadGroups([group.group_id,]);
      })
      .catch((e) => {
        console.log(e);
        this.setState({isSaving: false});
      })
  }

  handleSubmitCreate(formData) {
    const { group, actions: { saveItem, loadGroupChildren } } = this.props;
    const parent_id = group && group.group_id;
    const item = {
      ...formData,
      type: 'group',
      parent_id,
    };
    this.setState({isSaving: true});
    saveItem(item)
      .then(result => {
        this.setState({isSaving: false});
        loadGroupChildren(parent_id);
      })
      .catch((e) => {
        console.log(e);
        this.setState({isSaving: false});
      })
  }

  render() {
    const { group, groupTypesList, groupTypes, createMode } = this.props;
    const { isSaving, msg } = this.state;

    return (
      <div>
        <div>
          {isSaving ? 'Saving...' : (createMode ? 'Create new group' : 'Edit group')}
        </div>
        <GroupEditForm
          onSave={createMode ? this.handleSubmitCreate.bind(this) : this.handleSubmitSave.bind(this)}
          btnLabel={createMode ? 'Create' : 'Save'}
          initialValues={createMode ? {group_type_id: 1, name: ''} : group}
          groupTypesList={groupTypesList} />
      </div>
    );
  }
}

