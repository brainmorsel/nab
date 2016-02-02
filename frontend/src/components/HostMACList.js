import React, { Component, PropTypes } from 'react';
import HostMACListItem from './HostMACListItem.js';
import FormHostMacEdit from './FormHostMacEdit.js';


export default class HostMACList extends Component {
  constructor(props) {
    super(props);
    this.state = {isFetching: false, isSaving: false, msg: ''};
  }

  componentDidMount() {
    this.reloadData();
  }

  reloadData() {
    const { host } = this.props;
    const { loadHostMacs } = this.props.actions;

    if (!this.state.isFetching) {
      this.setState({isFetching: true});
      loadHostMacs(host.host_id)
        .then(() => {
          this.setState({isFetching: false});
        });
    }
  }

  handleSubmit(formData) {
    const { host: { host_id } } = this.props;
    const data = {
      ...formData,
      host_id
    };
    this.setState({isSaving: true});
    this.props.actions.saveHostMacData(data)
      .then(() => {
        this.setState({
          isSaving: false,
        });
      })
      .catch((e) => {/*ignore*/})
  }

  handleDelete(mac) {
    this.props.actions.deleteHostMac(mac);
  }

  render() {
    const { host } = this.props;
    const { getItemData } = this.props;
    const macs = host.macs || [];

    return (
      <div>
        <h4>MAC Addresses:</h4>
        <div className='host-mac-list-item mac-list-header'>
          <span className='mac-interface-name'>Interface</span>
          <span className='mac-addr'>Addr</span>
          <span className='mac-buttons'>Actions</span>
        </div>
        {this.state.isFetching ? <div className='host-mac-list-item'>Loading...</div> : ''}
        {macs.map(id => {
          const mac = getItemData({type: 'host_mac', mac_id: id});
          
          return (
            <HostMACListItem
              key={mac.mac_id}
              mac={mac}
              onSave={this.handleSubmit.bind(this)}
              onDelete={this.handleDelete.bind(this)}
              />
          );
        })}
        <div>Add new:</div>
        <FormHostMacEdit
          formKey={'new'}
          className='host-mac-list-item'
          btnLabel='Add'
          onSave={this.handleSubmit.bind(this)}
          />
      </div>
    );
  }
}
