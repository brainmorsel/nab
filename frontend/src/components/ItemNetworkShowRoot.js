import React, { Component, PropTypes } from 'react';
import urls from '../urls';
import { Link } from 'react-router';

export default class ItemNetworkShowRoot extends Component {
  render() {
    return (
      <div>
        <h3>Networks</h3>
        <Link to={urls.network.create()}>Create network</Link>
      </div>
    );
  }
}
