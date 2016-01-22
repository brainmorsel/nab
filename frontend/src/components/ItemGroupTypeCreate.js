import React, { Component, PropTypes } from 'react';
import FormGroupTypeEdit from './FormGroupTypeEdit.js';


export default class ItemGroupTypeCreate extends Component {
  constructor(props) {
    super(props);
    this.state = {isSaving: false, msg: ''};
  }

  handleSubmit(formData) {
    const data = {
      ...formData
    };
    this.setState({isSaving: true});
    this.props.actions.saveGroupTypeData(data)
      .then(() => {
        this.setState({
          isSaving: false,
        });
      })
      .catch((e) => {/*ignore*/})
  }
  render() {
    const { isSaving, msg } = this.state;

    return (
      <div>
        <h3>Create new group type</h3>
        <div>
          {isSaving ? 'Saving...' : ''}
        </div>
        <FormGroupTypeEdit
          onSave={this.handleSubmit.bind(this)}
          btnLabel='Create'
          initialValues={{icon_name: 'folder'}}
          />
      </div>
    );
  }
}
