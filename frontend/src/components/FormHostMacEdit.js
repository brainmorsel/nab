import React, { Component, PropTypes } from 'react';
import { reduxForm } from 'redux-form';
import classNames from 'classnames';
import Form from './Form';
import FormButton from './FormButton';

const validate = values => {
  const errors = {};
  if (!values.addr) {
    errors.addr = 'Required';
  } 
  return errors;
};

@reduxForm({
    form: 'hostMacEdit',
    fields: ['interface_name', 'addr'],
    validate
})
export default class FormHostMacEdit extends Component {
  render() {
    const { fields: { interface_name, addr } } = this.props;
    const { className, handleSubmit, onSave, onCancel, btnLabel } = this.props;

    return (
        <Form className={className} onSubmit={handleSubmit(onSave)}>
          <input className='mac-interface-name' type='text' placeholder='name' {...interface_name}/>
          <input className='mac-addr' type='text' placeholder='00:00:00:00:00:00' {...addr}/>
          <span className='mac-buttons'>
            <FormButton onClick={handleSubmit(onSave)}>{btnLabel}</FormButton>
            { onCancel ? <FormButton onClick={onCancel}>Cancel</FormButton> : ''}
          </span>
        </Form>
    );
  }
}
