import React, { Component, PropTypes } from 'react';
import { reduxForm } from 'redux-form';
import classNames from 'classnames';
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

  try {
      JSON.parse(values.data);
  } catch (e) {
      errors.data = ''+e;
  }

  return errors;
};

@reduxForm({
    form: 'hostEdit',
    fields: ['name', 'host_type_id', 'snmp_community_public', 'snmp_community_private', 'data'],
    validate
})
export default class HostEditForm extends Component {
  render() {
    const { fields: { name, host_type_id, snmp_community_public, snmp_community_private, data } } = this.props;
    const { className, hostTypes, handleSubmit, onSave, btnLabel } = this.props;

    return (
      <Form className={className} onSubmit={handleSubmit(onSave)}>
        <FormField field={host_type_id}>
          <label>type:</label>
          <span className='select'>
            <select size='1' {...host_type_id}>
              {Object.keys(hostTypes).map(type_id => <option key={type_id} value={type_id}>{hostTypes[type_id].name}</option>)}
            </select>
          </span>
        </FormField>
        <FormField field={name}>
          <label>hostname:</label>
          <input className='input' type='text' placeholder='hostname' {...name}/>
        </FormField>
        <FormField field={snmp_community_public}>
          <label>SNMP Community Public:</label>
          <input className='input' type='text' placeholder='public' {...snmp_community_public}/>
        </FormField>
        <FormField field={snmp_community_private}>
          <label>SNMP Community Private:</label>
          <input className='input' type='text' placeholder='private' {...snmp_community_private}/>
        </FormField>
        <FormField field={data}>
          <label>JSON Data:</label>
          <textarea className='textarea' {...data}/>
        </FormField>
        <FormButton className='is-primary' onClick={handleSubmit(onSave)}>{btnLabel}</FormButton>
      </Form>
    );
  }
}
