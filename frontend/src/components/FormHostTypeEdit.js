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
    form: 'hostTypeEdit',
    fields: ['name',],
    validate
})
export default class FormHostTypeEdit extends Component {
  render() {
    const { fields: { name } } = this.props;
    const { className, handleSubmit, onSave, btnLabel } = this.props;

    return (
        <Form className={className} onSubmit={handleSubmit(onSave)}>
          <FormField field={name}>
            <label>Name:</label>
            <input type='text' placeholder='name' {...name}/>
          </FormField>
          <FormButton onClick={handleSubmit(onSave)}>{btnLabel}</FormButton>
        </Form>
    );
  }
}
