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
    form: 'hostIpEdit',
    fields: ['interface_name', 'addr', 'network_id'],
    validate
})
export default class FormHostIpEdit extends Component {
  render() {
    const { fields: { interface_name, addr, network_id } } = this.props;
    const { className, handleSubmit, onSave, onCancel, btnLabel, networks } = this.props;

    return (
        <Form className={className} onSubmit={handleSubmit(onSave)}>
          <input className='ip-interface-name' type='text' placeholder='name' {...interface_name}/>
          <input className='ip-addr' type='text' placeholder='0.0.0.0' {...addr}/>
          <select className='ip-network' size='1' {...network_id}>
            {networks.map(nw => <option key={nw.network_id} value={nw.network_id}>{nw.name} ({nw.addr})</option>)}
          </select>
          <span className='ip-buttons'>
            <FormButton onClick={handleSubmit(onSave)}>{btnLabel}</FormButton>
            { onCancel ? <FormButton onClick={onCancel}>Cancel</FormButton> : ''}
          </span>
        </Form>
    );
  }
}
