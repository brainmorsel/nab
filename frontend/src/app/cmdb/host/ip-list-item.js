import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';
import classNames from 'classnames';

import Icon from 'ui/widgets/icon';
import { Button } from 'ui/form';
import { HostIpEditForm } from './ip-list-item-form';

import urls from 'app/urls';


export class HostIpListItem extends Component {
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

  renderShow() {
    const { ip, network, className } = this.props;
    return (
      <div className={className}>
        <span>{ip.interface_name}</span>
        <span>{ip.addr}</span>
        <Link to={urls.cmdb.network.show(network.network_id)}>{network.name} ({network.addr})</Link>
        <span style={{display: 'flex', alignContent: 'justify'}}>
          <Button href={'telnet://'+ip.addr} title='connect by telnet'>
            <Icon name='tty' fixedWidth />
          </Button>
          <Button onClick={this.goToEditMode.bind(this)}>Edit</Button>
          <Button onClick={this.goToDeleteMode.bind(this)}>Delete</Button>
        </span>
      </div>
    );
  }

  renderEdit() {
    const { networks } = this.props;
    const { ip, network, className } = this.props;

    return (
      <HostIpEditForm
        formKey={'ip'+ip.ip_id}
        className={className}
        btnLabel='Save'
        onCancel={this.goToShowMode.bind(this)}
        onSave={this.handleSave.bind(this)}
        initialValues={ip}
        networks={networks}
        />
    );
  }

  renderDelete() {
    const { ip, network, className } = this.props;
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
    const { ip, network } = this.props;
    
    if (ip && network) {
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
