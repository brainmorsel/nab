import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';

export default class Form extends Component {
  render() {
    const { className, children, onSubmit } = this.props;
    return (
      <form {...this.props}/>
    );
  }
}
