import React, { Component, PropTypes } from 'react';
import FormHostEdit from './FormHostEdit';

export default class ItemHostCreate extends Component {
  constructor(props) {
    super(props);
    this.state = {isSaving: false, msg: ''};
  }

  handleSubmit(formData) {
    const { item } = this.props;
    const data = {
      ...formData,
      data: JSON.parse(formData.data),
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
    return {
      host_type_id: 1,
      snmp_community_public: 'public',
      snmp_community_private: 'private',
      data: '{}',
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
            btnLabel='Create'
            initialValues={this.formInitialValues()}
            hostTypes={hostTypes} />
      </div>
    );
  }
}
