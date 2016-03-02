import React, { Component, PropTypes } from 'react';
import { reduxForm } from 'redux-form';
import classNames from 'classnames';

import { Form, Field, Button } from 'ui/form';

const validateString = (name, params={}) => {
  if (params.required && !name) {
    return 'Required';
  }
  if (params.lengthLess && name.length > params.lengthLess) {
    return `Must be ${params.lengthLess} characters or less`;
  }
  if (params.lengthMore && hame.length < params.lengthMore) {
    return `Must be ${params.lengthMore} characters or more`;
  }
};

const validateJSONString = (JSONString) => {
  try {
    JSON.parse(JSONString);
  } catch (e) {
    return ''+e;
  }
}

const validate = values => {
  return {
    name: validateString(values.name, {required: true, lengthLess: 127}),
    data: validateJSONString(values.data),
  };
};

@reduxForm({
  form: 'hostEdit',
  fields: ['name', 'host_type_id', 'snmp_community_public', 'snmp_community_private', 'data', 'description'],
  validate
})
export class HostEditForm extends Component {
  render() {
    const { fields: { name, host_type_id, snmp_community_public, snmp_community_private, data, description } } = this.props;
    const { hostTypesList, handleSubmit, onSave, btnLabel  } = this.props;

    return (
      <Form onSubmit={ handleSubmit(onSave) }>
        <Field label='Name:' inputProps={name}>
          <input type='text' placeholder='name'/>
        </Field>
        <Field label='Host Type:' inputProps={host_type_id}>
          <select size='1'>
            { hostTypesList.map(t => <option key={t.host_type_id} value={t.host_type_id}>{t.name}</option>) }
          </select>
        </Field>
        <Field label='SNMP Public:' inputProps={snmp_community_public}>
          <input type='text' placeholder='public'/>
        </Field>
        <Field label='SNMP Private:' inputProps={snmp_community_private}>
          <input type='text' placeholder='private'/>
        </Field>
        <Field label='Description:' inputProps={description}>
          <textarea rows='5'/>
        </Field>
        <Field label='JSON Data:' inputProps={data}>
          <textarea rows='5' />
        </Field>
        <Button onClick={handleSubmit(onSave)}>{btnLabel}</Button>
      </Form>
    );
  }
}
