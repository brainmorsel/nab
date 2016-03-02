import React, { Component, PropTypes } from 'react';
import { reduxForm } from 'redux-form';
import classNames from 'classnames';

import { Form, Field, Button } from 'ui/form';

const validateName = (name) => {
  if (!name) {
    return 'Required';
  }
  if (name.length > 127) {
    return 'Must be 127 characters or less';
  }
};

const validate = values => {
  return {
    name: validateName(values.name),
  };
};

@reduxForm({
  form: 'groupEdit',
  fields: ['name', 'group_type_id',],
  validate
})
export class GroupEditForm extends Component {
  render() {
    const { fields: { name, group_type_id }, handleSubmit, onSave, btnLabel } = this.props;
    const { groupTypesList } = this.props;

    return (
      <Form onSubmit={ handleSubmit(onSave) }>
        <Field label='Name:' inputProps={name}>
          <input type='text' placeholder='name'/>
        </Field>
        <Field label='Group Type:' inputProps={group_type_id}>
          <select size='1'>
            { groupTypesList.map(t => <option key={t.group_type_id} value={t.group_type_id}>{t.name}</option>) }
          </select>
        </Field>
        <Button onClick={handleSubmit(onSave)}>{btnLabel}</Button>
      </Form>
    );
  }
}

/*

 */
