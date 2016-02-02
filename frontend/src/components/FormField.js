import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';

export default class FormField extends Component {
  render() {
    const { className, children } = this.props;
    const field = this.props.field || {};
    return (
      <div className={classNames(className, 'control', {'error': field.touched && field.error})}>
        {children}
        {field.touched && field.error && <div>{field.error}</div>}
      </div>
    );
  }
}
