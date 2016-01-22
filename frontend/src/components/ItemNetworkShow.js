import React, { Component, PropTypes } from 'react';
import urls from '../urls';
import { Link } from 'react-router';

export default class ItemNetworkShow extends Component {
  render() {
    const { item } = this.props;

    return (
      <div>
        <ul>
          <li>Name: {item.name}</li>
          <li>Address: {item.addr}</li>
          <li>VLAN ID: {item.vlan_id}</li>
          <li>VLAN QinQ ID: {item.vlan_qinq_id}</li>
          <li>MPLS ID: {item.mpls_id}</li>
        </ul>
      </div>
    );
  }
}
