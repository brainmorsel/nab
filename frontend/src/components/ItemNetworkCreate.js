import React, { Component, PropTypes } from 'react';
import FormNetworkEdit from './FormNetworkEdit';

export default class ItemNetworkCreate extends Component {
  constructor(props) {
    super(props);
    this.state = {isSaving: false, msg: ''};
  }

  handleSubmit(formData) {
    const item = this.props.item || {};
    const data = {
      ...formData,
      parent_id: item.network_id,
    };
    this.setState({isSaving: true});
    this.props.actions.saveNetworkData(data)
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
        <h3>Create new network</h3>
        <div>
          {isSaving ? 'Saving...' : ''}
        </div>
        <FormNetworkEdit
          onSave={this.handleSubmit.bind(this)}
          btnLabel='Create'
          initialValues={{}}
          />
      </div>
    );
  }
}
