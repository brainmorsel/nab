import React, { Component, PropTypes } from 'react';
import urls from '../urls';
import { Link } from 'react-router';

export default class ItemHostShow extends Component {
  render() {
    const { item, hostTypes } = this.props;
    const hostType = hostTypes[item.host_type_id] || {};

    return (
      <div>
        <ul>
          <li>host name: {item.name}</li>
          <li>host type: {hostType.name}</li>
        </ul>
      </div>
    );
  }
}
