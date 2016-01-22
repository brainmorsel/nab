import React, { Component, PropTypes } from 'react';
import FormHostTypeEdit from './FormHostTypeEdit.js';


export default class ItemHostTypeCreate extends Component {
  constructor(props) {
    super(props);
    this.state = {isSaving: false, msg: ''};
  }

  handleSubmit(formData) {
    const data = {
      ...formData
    };
    this.setState({isSaving: true});
    this.props.actions.saveHostTypeData(data)
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
        <h3>Create new host type</h3>
        <div>
          {isSaving ? 'Saving...' : ''}
        </div>
        <FormHostTypeEdit
          onSave={this.handleSubmit.bind(this)}
          btnLabel='Create'
          />
      </div>
    );
  }
}
