import React, { Component, PropTypes } from 'react';
import { reduxForm } from 'redux-form';
import Form from './Form';
import FormField from './FormField';
import FormButton from './FormButton';

const validate = values => {
  const errors = {};
  if (!values.name) {
    errors.name = 'Required';
  } else if (values.name.length > 127) {
    errors.name = 'Must be 127 characters or less';
  }
  return errors;
};

@reduxForm({
    form: 'networkEdit',
    fields: ['name', 'addr', 'vlan_id', 'vlan_qinq_id', 'mpls_id'],
    validate
})
export default class FormNetworkEdit extends Component {
  render() {
    const { fields: { name, addr, vlan_id, vlan_qinq_id, mpls_id } } = this.props;
    const { className, handleSubmit, onSave, btnLabel } = this.props;

    return (
        <Form className={className} onSubmit={handleSubmit(onSave)}>
          <FormField field={name}>
            <label>Name:</label>
            <input type='text' placeholder='name' {...name}/>
          </FormField>
          <FormField field={addr}>
            <label>Address:</label>
            <input type='text' placeholder='0.0.0.0/0' {...addr}/>
          </FormField>
          <FormField field={vlan_id}>
            <label>VLAN ID:</label>
            <input type='text' placeholder='1-4095' {...vlan_id}/>
          </FormField>
          <FormField field={vlan_qinq_id}>
            <label>VLAN QinQ ID:</label>
            <input type='text' placeholder='1-4095' {...vlan_qinq_id}/>
          </FormField>
          <FormField field={mpls_id}>
            <label>MPLS ID:</label>
            <input type='text' placeholder='' {...mpls_id}/>
          </FormField>
          <FormButton onClick={handleSubmit(onSave)}>{btnLabel}</FormButton>
        </Form>
    );
  }
}
