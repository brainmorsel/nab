import React, { Component, PropTypes } from 'react';
import FormHostTypeEdit from './FormHostTypeEdit.js';


export default class ItemHostTypeEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {isSaving: false, msg: ''};
  }

  handleSubmit(formData) {
    const { host_type_id } = this.props.params;
    const data = {
      ...formData,
      host_type_id
    };
    this.setState({isSaving: true});
    this.props.actions.saveHostTypeData(data)
      .then(() => {
        this.setState({
          isSaving: false
        });
      })
      .catch((e) => {/*ignore*/})
  }
  render() {
    const { host_type_id } = this.props.params;
    const { getItemData } = this.props;
    const item = getItemData({type: 'host_type', host_type_id});
    const { isSaving, msg } = this.state;

    return (
      item
        ? <div>
            <h3>{item.name}</h3>
            <div>
              {isSaving ? 'Saving...' : ''}
            </div>
            <FormHostTypeEdit
              onSave={this.handleSubmit.bind(this)}
              btnLabel='Save'
              initialValues={item}
              />
          </div>
        : <div>Loading...</div>
    );
  }
}
