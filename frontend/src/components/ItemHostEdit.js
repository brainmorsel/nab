import React, { Component, PropTypes } from 'react';
import FormHostEdit from './FormHostEdit';

export default class ItemHostEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {isSaving: false, msg: ''};
  }

  handleSubmit(formData) {
    const { item } = this.props;
    const data = {
      ...formData,
      data: JSON.parse(formData.data),
      host_id: item.host_id,
      group_id: item.group_id,
    };
    this.setState({isSaving: true});
    this.props.actions.saveHostData(data)
      .then(() => {
        this.setState({
          isSaving: false,
        });
      })
      .catch((e) => {/*ignore*/})
  }

  formInitialValues() {
    const { item } = this.props;

    return {
      ...item,
      data: JSON.stringify(item.data),
    };
  }

  render() {
    const { item, hostTypes } = this.props;
    const { isSaving, msg } = this.state;

    return (
      <div>
        <div>
          {isSaving ? 'Saving...' : ''}
        </div>
        <FormHostEdit
            onSave={this.handleSubmit.bind(this)}
            btnLabel='Save'
            initialValues={this.formInitialValues()}
            hostTypes={hostTypes} />
      </div>
    );
  }
}
