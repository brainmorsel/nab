import React, { Component, PropTypes } from 'react';
import FontAwesome from 'react-fontawesome';

export default class Icon extends Component {
  render() {
    return (
      <FontAwesome {...this.props} />
    );
  }
}
