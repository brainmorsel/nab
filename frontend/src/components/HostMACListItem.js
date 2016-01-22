import React, { Component, PropTypes } from 'react';
import FormButton from './FormButton.js';
import FormHostMacEdit from './FormHostMacEdit.js';

import { Link } from 'react-router';
import urls from '../urls';


export default class HostMACListItem extends Component {
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

  renderShow(mac) {
    return (
      <div className='host-mac-list-item'>
        <span className='mac-interface-name'>{mac.interface_name}</span>
        <span className='mac-addr'>{mac.addr}</span>
        <span className='mac-buttons'>
          <FormButton onClick={this.goToEditMode.bind(this)}>Edit</FormButton>
          <FormButton onClick={this.goToDeleteMode.bind(this)}>Delete</FormButton>
        </span>
      </div>
    );
  }

  renderEdit(mac) {
    return (
      <FormHostMacEdit
        formKey={'mac'+mac.mac_id}
        className='host-mac-list-item'
        btnLabel='Save'
        onCancel={this.goToShowMode.bind(this)}
        onSave={this.handleSave.bind(this)}
        initialValues={mac}
        />
    );
  }

  renderDelete(mac) {
    return (
      <div className='host-mac-list-item'>
        <span className='mac-message'>Are you sure?</span>
        <span className='mac-buttons'>
          <FormButton onClick={this.handleDelete.bind(this)}>Confirm</FormButton>
          <FormButton onClick={this.goToShowMode.bind(this)}>Cancel</FormButton>
        </span>
      </div>
    );
  }

  render() {
    const { mac } = this.props;
    
    if (mac) {
      switch (this.state.mode) {
        case 'show':
          return this.renderShow(mac);
        case 'edit':
          return this.renderEdit(mac);
        case 'delete':
          return this.renderDelete(mac);
      }
    } else {
      return (
        <div>Loading...</div>
      );
    }
  }
}
