import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';

import * as cmdbSelectors from 'app/cmdb/selectors';
import * as selectors from './selectors';
import * as actions from 'app/cmdb/actions';

import styles from './ip-list.css';
import { View } from 'ui/layout';
import { HostIpListItem } from './ip-list-item';
import { HostIpEditForm } from './ip-list-item-form';


const hostSelector = (state, props) => props.host;

const itemsSelector = createSelector(
  hostSelector,
  cmdbSelectors.hostsIps,
  cmdbSelectors.networks,
  cmdbSelectors.networksAllList,
  (host, hostsIps, networks, networksList) => {
    const ips = (host.ips || []).map(id => {
      const ip = hostsIps[id];

      return {
        ...ip,
        network: networks[ip.network_id],
      }
    });

    return {
      ips,
      host_id: host.host_id,
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
export class HostIPList extends Component {
  constructor(props) {
    super(props);
    this.state = {isFetching: false, isSaving: false};
  }

  componentDidMount() {
    const { host_id } = this.props;

    this.reloadData(host_id);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.host_id !== nextProps.host_id) {
      this.reloadData(nextProps.host_id);
    }
  }

  reloadData(host_id) {
    const { loadHostIps } = this.props.actions;

    if (host_id === undefined) {
      return;
    }

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
      type: 'host_ip',
      host_id
    };
    this.setState({isSaving: true});
    this.props.actions.saveItem(data)
      .then(() => {
        this.setState({isSaving: false});
        this.reloadData(host_id);
      })
      .catch((e) => {
        console.log(e);
        this.setState({isSaving: false});
      })
  }

  handleDelete(ip) {
    const { host_id, actions: { deleteItem } } = this.props;
    deleteItem(ip)
      .then(() => {
        this.reloadData(host_id);
      })
      .catch((e) => {
        console.log(e);
      })
  }


  render() {
    const { ips, networksList, ...other } = this.props;

    return (
      <View layout='vertical' {...other}>
        <View height={25}>
          <b>IP Addresses:</b>
        </View>
        <View height={25}>
          <HostIpEditForm
            formKey={'new'}
            className={styles.form}
            btnLabel='Add'
            onSave={this.handleSubmit.bind(this)}
            networks={networksList}
            initialValues={{network_id: 1}}
            />
        </View>
        <View style={{overflowY: 'scroll'}}>
          <div>
            <div className={styles.form}>
              <span>Interface</span>
              <span>Addr</span>
              <span>Network</span>
              <span>Actions</span>
            </div>
            {ips.length == 0 && this.state.isFetching
              ? <div>Loading...</div> : ''}
            {ips.map(ip => {
              return (
                <HostIpListItem
                  className={styles.form}
                  key={ip.ip_id}
                  ip={ip}
                  network={ip.network}
                  networks={networksList}
                  onSave={this.handleSubmit.bind(this)}
                  onDelete={this.handleDelete.bind(this)}
                  />
              );
            })}
          </div>
        </View>
      </View>
    );
  }
}
