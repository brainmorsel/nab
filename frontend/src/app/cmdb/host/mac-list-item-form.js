import React, { Component, PropTypes } from 'react';
import { reduxForm } from 'redux-form';
import classNames from 'classnames';
import { Form, Button } from 'ui/form';

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
export class HostMacEditForm extends Component {
  render() {
    const { fields: { interface_name, addr } } = this.props;
    const { className, handleSubmit, onSave, onCancel, btnLabel } = this.props;

    return (
        <Form className={className} onSubmit={handleSubmit(onSave)}>
          <input type='text' placeholder='name' {...interface_name}/>
          <input type='text' placeholder='00:00:00:00:00:00' {...addr}/>
          <span className='buttons'>
            <Button onClick={handleSubmit(onSave)}>{btnLabel}</Button>
            { onCancel ? <Button onClick={onCancel}>Cancel</Button> : ''}
          </span>
        </Form>
    );
  }
}
