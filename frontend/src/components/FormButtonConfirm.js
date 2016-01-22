import React, { Component, PropTypes } from 'react';
import FormButton from './FormButton.js';

export default class FormButtonConfirm extends Component {
  constructor(props) {
    super(props);
    this.state = {showConfirm: false};
  }

  handleShowConfirm() {
    this.setState({showConfirm: true});
  }

  handleCancel() {
    this.setState({showConfirm: false});
  }

  handleClick() {
    const { onClick } = this.props;
    this.setState({showConfirm: false});
    onClick();
  }

  render() {
    const { showConfirm } = this.state;

    return (
      showConfirm
        ? <span>
            <FormButton onClick={this.handleClick.bind(this)}>Confirm</FormButton>
            <FormButton onClick={this.handleCancel.bind(this)}>Cancel</FormButton>
          </span>
        : <span>
            <FormButton onClick={this.handleShowConfirm.bind(this)}>{this.props.children}</FormButton>
          </span>
    );
  }
}
