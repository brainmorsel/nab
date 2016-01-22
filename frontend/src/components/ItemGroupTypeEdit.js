import React, { Component, PropTypes } from 'react';
import FormGroupTypeEdit from './FormGroupTypeEdit.js';


export default class ItemGroupTypeEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {isSaving: false, msg: ''};
  }

  handleSubmit(formData) {
    const { group_type_id } = this.props.params;
    const data = {
      ...formData,
      group_type_id
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
    const { group_type_id } = this.props.params;
    const { getItemData } = this.props;
    const item = getItemData({type: 'group_type', group_type_id});
    const { isSaving, msg } = this.state;

    return (
      item
        ? <div>
            <h3>{item.name}</h3>
            <div>
              {isSaving ? 'Saving...' : ''}
            </div>
            <FormGroupTypeEdit
              onSave={this.handleSubmit.bind(this)}
              btnLabel='Save'
              initialValues={item}
              />
          </div>
        : <div>Loading...</div>
    );
  }
}
