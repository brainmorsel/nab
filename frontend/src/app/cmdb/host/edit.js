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
import { HostEditForm } from './edit-form';


function mapActionsToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

const createModeSelector = (state, props) => props.route.createMode;
const groupIdSelector = (state, props) => props.params.group_id;

const selector = createSelector(
  selectors.hostIdFromParams,
  selectors.currentHost,
  cmdbSelectors.hostTypesList,
  createModeSelector,
  groupIdSelector,
  (host_id, host, hostTypesList, createMode, group_id) => {
    return {
      host_id,
      host,
      hostTypesList,
      createMode,
      group_id,
    }
  }
);

@connect(selector, mapActionsToProps)
export class HostEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {isSaving: false, msg: ''};
  }

  componentDidMount() {
    const { hostTypesList, actions: { loadHostTypes } } = this.props;

    if (!hostTypesList.length) {
      loadHostTypes();
    }
  }

  handleSubmitSave(formData) {
    const { host, actions: { saveItem, loadHosts } } = this.props;
    const item = {
      ...host,
      ...formData,
      data: JSON.parse(formData.data)
    };
    this.setState({isSaving: true});
    saveItem(item)
      .then(result => {
        this.setState({isSaving: false});
        loadHosts([host.host_id,]);
      })
      .catch((e) => {
        console.log(e);
        this.setState({isSaving: false});
      })
  }

  handleSubmitCreate(formData) {
    const { group_id, actions: { saveItem, loadGroupChildren } } = this.props;
    const item = {
      ...formData,
      data: JSON.parse(formData.data),
      type: 'host',
      group_id,
    };
    this.setState({isSaving: true});
    saveItem(item)
      .then(result => {
        this.setState({isSaving: false});
        loadGroupChildren(group_id);
      })
      .catch((e) => {
        console.log(e);
        this.setState({isSaving: false});
      })
  }

  render() {
    const { host_id, host, hostTypesList, createMode, ...other } = this.props;
    const { isSaving, msg } = this.state;

    return (
      <View {...other} style={{overflowY: 'auto'}}>
        <div>
          {isSaving ? 'Saving...' : (createMode ? 'Create new host' : 'Edit host')}
        </div>
        <HostEditForm
          onSave={createMode ? this.handleSubmitCreate.bind(this) : this.handleSubmitSave.bind(this)}
          btnLabel={createMode ? 'Create' : 'Save'}
          initialValues={
            createMode
              ? {host_type_id: 1, name: '', data: '{}', snmp_community_public:'', snmp_community_private:'', description: ''}
              : {...host, data: JSON.stringify(host.data),}
          }
          hostTypesList={hostTypesList} />
      </View>
    );
  }
}

