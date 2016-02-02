import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect'
import HostIPListItem from './HostIPListItem.js';
import FormHostIpEdit from './FormHostIpEdit.js';


const hostsSelector = state => state.data.hosts;
const hostIpsSelector = state => state.data.host_ips;
const hostIdSelector = (state, props) => props.host_id;
const networksSelector = state => state.data.networks;
const networksListSelector = createSelector(
  networksSelector,
  (networks) => {
    return Object.keys(networks).map(id => networks[id]);
  }
);
const itemsSelector = createSelector(
  hostsSelector,
  hostIpsSelector,
  hostIdSelector,
  networksSelector,
  networksListSelector,
  (hosts, host_ips, host_id, networks, networksList) => {
    const host = hosts[host_id] || {};
    const ips = (host.ips || []).map(id => {
      const ip = host_ips[id];

      return {
        ...ip,
        network: networks[ip.network_id],
      }
    });

    return {
      ips,
      host_id,
      networksList,
    }
  }
);

function mapActionsToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

@connect(itemsSelector, mapActionsToProps)
export default class HostIPList extends Component {
  constructor(props) {
    super(props);
    this.state = {isFetching: false, isSaving: false, msg: ''};
  }

  componentDidMount() {
    const { host_id } = this.props;
    const { loadNetworksAll } = this.props.actions;

    loadNetworksAll();
    this.reloadData(host_id);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.host_id !== nextProps.host_id) {
      this.reloadData(nextProps.host_id);
    }
  }

  reloadData(host_id) {
    const { loadHostIps } = this.props.actions;

    if (!this.state.isFetching) {
      this.setState({isFetching: true});
      loadHostIps(host_id)
        .then(() => {
          this.setState({isFetching: false});
        });
    }
  }

  handleSubmit(formData) {
    const { host_id } = this.props;
    const data = {
      ...formData,
      host_id
    };
    this.setState({isSaving: true});
    this.props.actions.saveHostIpData(data)
      .then(() => {
        this.setState({
          isSaving: false,
        });
      })
      .catch((e) => {/*ignore*/})
  }

  handleDelete(ip) {
    this.props.actions.deleteHostIp(ip);
  }


  render() {
    const { ips, networksList } = this.props;

    return (
      <div>
        <h4>IP Addresses:</h4>
        <div className='host-ip-list-item ip-list-header'>
          <span className='ip-interface-name'>Interface</span>
          <span className='ip-addr'>Addr</span>
          <span className='ip-network'>Network</span>
          <span className='ip-buttons'>Actions</span>
        </div>
        {ips.length == 0 && this.state.isFetching
          ? <div className='host-ip-list-item'>Loading...</div> : ''}
        {ips.map(ip => {
          return (
            <HostIPListItem
              key={ip.ip_id}
              ip={ip}
              network={ip.network}
              networks={networksList}
              onSave={this.handleSubmit.bind(this)}
              onDelete={this.handleDelete.bind(this)}
              />
          );
        })}
        <div>Add new:</div>
        <FormHostIpEdit
          formKey={'new'}
          className='host-ip-list-item'
          btnLabel='Add'
          onSave={this.handleSubmit.bind(this)}
          networks={networksList}
          initialValues={{network_id: 1}}
          />
      </div>
    );
  }
}
