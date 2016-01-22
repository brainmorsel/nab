import React, { Component, PropTypes } from 'react';
import FormGroupEdit from './FormGroupEdit';

export default class ItemGroupCreate extends Component {
  constructor(props) {
    super(props);
    this.state = {isSaving: false, msg: ''};
  }

  handleSubmit(formData) {
    const item = this.props.item || {};
    const data = {
      ...formData,
      parent_id: item.group_id,
    };

    this.setState({isSaving: true});
    this.props.actions.saveGroupData(data)
      .then(result => {
        this.setState({
          isSaving: false,
        });
      })
      .catch((e) => {/*ignore*/})
  }

  render() {
    const { item, groupTypes } = this.props;
    const { isSaving, msg } = this.state;

    return (
      <div>
        <div>
          {isSaving ? 'Saving...' : ''}
        </div>
        <FormGroupEdit
          onSave={this.handleSubmit.bind(this)}
          btnLabel='Create'
          initialValues={{group_type_id: 1}}
          groupTypes={groupTypes} />
      </div>
    );
  }
}
