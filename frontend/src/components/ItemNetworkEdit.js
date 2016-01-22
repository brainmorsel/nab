import React, { Component, PropTypes } from 'react';
import FormNetworkEdit from './FormNetworkEdit';

export default class ItemNetworkEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {isSaving: false, msg: ''};
  }

  handleSubmit(formData) {
    const { item } = this.props;
    const data = {
      ...formData,
      network_id: item.network_id,
      parent_id: item.parent_id,
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
    const { item } = this.props;
    const { isSaving, msg } = this.state;

    return (
      <div>
        <div>
          {isSaving ? 'Saving...' : ''}
        </div>
        <FormNetworkEdit
          onSave={this.handleSubmit.bind(this)}
          btnLabel='Save'
          initialValues={item}
          />
      </div>
    );
  }
}
