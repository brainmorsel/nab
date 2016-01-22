import React, { Component, PropTypes } from 'react';
import urls from '../urls';
import { Link } from 'react-router';

export default class ItemGroupShowRoot extends Component {
  render() {
    return (
      <div>
        <h3>Groups</h3>
        <Link to={urls.group.create()}>Create subgroup</Link>
      </div>
    );
  }
}
