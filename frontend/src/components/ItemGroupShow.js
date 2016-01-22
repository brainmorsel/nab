import React, { Component, PropTypes } from 'react';
import urls from '../urls';
import { Link } from 'react-router';

export default class ItemGroupShow extends Component {
  render() {
    const { item } = this.props;

    return (
      <div>
        Show Group.
      </div>
    );
  }
}
