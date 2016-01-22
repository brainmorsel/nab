import React, { Component, PropTypes } from 'react';
import FormGroupEdit from './FormGroupEdit';

export default class ItemGroupEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {isSaving: false, msg: ''};
  }

  handleSubmit(formData) {
    const { item } = this.props;
    const data = {
      ...formData,
      group_id: item.group_id,
      parent_id: item.parent_id,
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
          btnLabel='Save'
          initialValues={item}
          groupTypes={groupTypes} />
      </div>
    );
  }
}
