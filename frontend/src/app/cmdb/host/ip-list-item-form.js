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
    form: 'hostIpEdit',
    fields: ['interface_name', 'addr', 'network_id'],
    validate
})
export class HostIpEditForm extends Component {
  render() {
    const { fields: { interface_name, addr, network_id } } = this.props;
    const { className, handleSubmit, onSave, onCancel, btnLabel, networks } = this.props;

    return (
        <Form className={className} onSubmit={handleSubmit(onSave)}>
          <input type='text' placeholder='name' {...interface_name}/>
          <input type='text' placeholder='0.0.0.0' {...addr}/>
          <select className='input' size='1' {...network_id}>
            {networks.map(nw => <option key={nw.network_id} value={nw.network_id}>{nw.name} ({nw.addr})</option>)}
          </select>
          <span className='buttons'>
            <Button onClick={handleSubmit(onSave)}>{btnLabel}</Button>
            { onCancel ? <Button onClick={onCancel}>Cancel</Button> : ''}
          </span>
        </Form>
    );
  }
}
