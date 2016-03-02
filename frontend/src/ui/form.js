import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';

import styles from './form.css';

export class Form extends Component {
  render() {
    const { className, children, onSubmit } = this.props;
    return (
      <form {...this.props} className={classNames(styles.form, className)}/>
    );
  }
}


export class Field extends Component {
  render() {
    const { className, inputProps, label, children } = this.props;
    const isError = inputProps.touched && inputProps.error;

    return (
      <div className={classNames(styles.field, className, {'error': isError})}>
        { label && <label>{label}</label> }
        { React.Children.map(children, (element, idx) => {
          return React.cloneElement(element, inputProps);
        }) }
        { isError && <div>{inputProps.error}</div> }
      </div>
    );
  }
}

export class Button extends Component {
  render() {
    const { className, href, ...other } = this.props;

    if (href) {
      return <a {...other} href={href} className={classNames(styles.button, className)} />
    }
    return (
      <button {...other} className={classNames(styles.button, className)}/>
    );
  }
}


export class ButtonConfirm extends Component {
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
            <Button onClick={this.handleClick.bind(this)}>Confirm</Button>
            <Button onClick={this.handleCancel.bind(this)}>Cancel</Button>
          </span>
        : <span>
            <Button onClick={this.handleShowConfirm.bind(this)}>{this.props.children}</Button>
          </span>
    );
  }
}
