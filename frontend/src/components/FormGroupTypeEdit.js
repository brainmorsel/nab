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

  if (!values.icon_name) {
    errors.icon_name = 'Required';
  } else if (values.icon_name.length > 127) {
    errors.icon_name = 'Must be 127 characters or less';
  }
  return errors;
};

@reduxForm({
    form: 'groupTypeEdit',
    fields: ['name', 'icon_name',],
    validate
})
export default class FormGroupTypeEdit extends Component {
  render() {
    const { fields: { name, icon_name } } = this.props;
    const { className, handleSubmit, onSave, btnLabel } = this.props;

    return (
        <Form className={className} onSubmit={handleSubmit(onSave)}>
          <FormField field={name}>
            <label>Name:</label>
            <input className='input' type='text' placeholder='name' {...name}/>
          </FormField>
          <FormField field={icon_name}>
            <label>Icon Name:</label>
            <input className='input' type='text' placeholder='icon name' {...icon_name}/>
          </FormField>
          <FormButton className='is-primary' onClick={handleSubmit(onSave)}>{btnLabel}</FormButton>
        </Form>
    );
  }
}
