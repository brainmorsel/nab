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
  return errors;
};

@reduxForm({
    form: 'groupEdit',
    fields: ['name', 'group_type_id',],
    validate
})
export default class FormGroupEdit extends Component {
  render() {
    const { fields: { name, group_type_id }, handleSubmit, onSave, btnLabel } = this.props;
    const { className, groupTypes } = this.props;

    return (
        <Form className={className} onSubmit={handleSubmit(onSave)}>
          <FormField field={name}>
            <label>Name:</label>
            <input className='input' type='text' placeholder='name' {...name}/>
          </FormField>
          <FormField field={group_type_id}>
            <label>Group Type:</label>
            <div className='select'>
              <select {...group_type_id} size='1'>
                {Object.keys(groupTypes).map(id => <option key={id} value={id}>{groupTypes[id].name}</option>)}
              </select>
            </div>
          </FormField>
          <FormButton className='is-primary' onClick={handleSubmit(onSave)}>{btnLabel}</FormButton>
        </Form>
    );
  }
}
