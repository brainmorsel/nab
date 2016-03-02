import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';
import classNames from 'classnames';

import { Button } from 'ui/form';
import { HostMacEditForm } from './mac-list-item-form';

import urls from 'app/urls';


export class HostMacListItem extends Component {
  constructor(props) {
    super(props);
    this.state = {mode: 'show'};
  }

  goToEditMode() {
    this.setState({mode: 'edit'});
  }

  goToShowMode() {
    this.setState({mode: 'show'});
  }

  goToDeleteMode() {
    this.setState({mode: 'delete'});
  }

  handleSave(formData) {
    const { onSave, mac: {mac_id} } = this.props;

    this.goToShowMode();
    onSave({...formData, mac_id});
  }

  handleDelete() {
    const { onDelete, mac } = this.props;

    onDelete(mac);
  }

  renderShow() {
    const { mac, className } = this.props;
    return (
      <div className={className}>
        <span>{mac.interface_name}</span>
        <span>{mac.addr}</span>
        <span>
          <Button onClick={this.goToEditMode.bind(this)}>Edit</Button>
          <Button onClick={this.goToDeleteMode.bind(this)}>Delete</Button>
        </span>
      </div>
    );
  }

  renderEdit() {
    const { mac, className } = this.props;
    return (
      <HostMacEditForm
        formKey={'mac'+mac.mac_id}
        className={className}
        btnLabel='Save'
        onCancel={this.goToShowMode.bind(this)}
        onSave={this.handleSave.bind(this)}
        initialValues={mac}
        />
    );
  }

  renderDelete() {
    const { mac, className } = this.props;
    return (
      <div className={className}>
        <span>Are you sure?</span>
        <span>
          <Button onClick={this.handleDelete.bind(this)}>Confirm</Button>
          <Button onClick={this.goToShowMode.bind(this)}>Cancel</Button>
        </span>
      </div>
    );
  }

  render() {
    const { mac } = this.props;

    if (mac) {
      switch (this.state.mode) {
        case 'show':
          return this.renderShow();
        case 'edit':
          return this.renderEdit();
        case 'delete':
          return this.renderDelete();
      }
    } else {
      return (
        <div>Loading...</div>
      );
    }
  }
}
