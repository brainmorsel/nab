import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';

export default class FormButton extends Component {
  render() {
    const { className } = this.props;
    return (
      <button {...this.props}/>
    );
  }
}
