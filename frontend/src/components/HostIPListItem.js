import React, { Component, PropTypes } from 'react';
import FormButton from './FormButton.js';
import FormHostIpEdit from './FormHostIpEdit.js';
import Icon from './Icon.js';

import { Link } from 'react-router';
import urls from '../urls';


export default class HostIPListItem extends Component {
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
    const { onSave, ip: {ip_id} } = this.props;

    this.goToShowMode();
    onSave({...formData, ip_id});
  }

  handleDelete() {
    const { onDelete, ip } = this.props;

    onDelete(ip);
  }

  renderShow(ip, network) {
    return (
      <div className='host-ip-list-item'>
        <span className='ip-interface-name'>{ip.interface_name}</span>
        <span className='ip-addr'>{ip.addr}</span>
        <Link className='ip-network' to={urls.network.show(network.network_id)}>{network.name} ({network.addr})</Link>
        <span className='ip-buttons'>
          <a className='button' href={'telnet://'+ip.addr} title='connect by telnet'>
            <Icon name='tty' fixedWidth />
          </a>
          <FormButton onClick={this.goToEditMode.bind(this)}>Edit</FormButton>
          <FormButton onClick={this.goToDeleteMode.bind(this)}>Delete</FormButton>
        </span>
      </div>
    );
  }

  renderEdit(ip, network) {
    const { networks } = this.props;

    return (
      <FormHostIpEdit
        formKey={'ip'+ip.ip_id}
        className='host-ip-list-item'
        btnLabel='Save'
        onCancel={this.goToShowMode.bind(this)}
        onSave={this.handleSave.bind(this)}
        initialValues={ip}
        networks={networks}
        />
    );
  }

  renderDelete(ip, network) {
    return (
      <div className='host-ip-list-item'>
        <span className='ip-message'>Are you sure?</span>
        <span className='ip-buttons'>
          <FormButton onClick={this.handleDelete.bind(this)}>Confirm</FormButton>
          <FormButton onClick={this.goToShowMode.bind(this)}>Cancel</FormButton>
        </span>
      </div>
    );
  }

  render() {
    const { ip, network } = this.props;
    
    if (ip && network) {
      switch (this.state.mode) {
        case 'show':
          return this.renderShow(ip, network);
        case 'edit':
          return this.renderEdit(ip, network);
        case 'delete':
          return this.renderDelete(ip, network);
      }
    } else {
      return (
        <div>Loading...</div>
      );
    }
  }
}
