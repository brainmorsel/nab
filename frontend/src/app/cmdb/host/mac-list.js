import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';

import * as cmdbSelectors from 'app/cmdb/selectors';
import * as selectors from './selectors';
import * as actions from 'app/cmdb/actions';

import styles from './ip-list.css';
import { View } from 'ui/layout';
import { HostMacListItem } from './mac-list-item';
import { HostMacEditForm } from './mac-list-item-form';


const hostSelector = (state, props) => props.host;

const itemsSelector = createSelector(
  hostSelector,
  cmdbSelectors.hostsMacs,
  (host, hostsMacs) => {
    const macs = (host.macs || []).map(id => hostsMacs[id]);

    return {
      macs,
      host_id: host.host_id,
    }
  }
);

function mapActionsToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

@connect(itemsSelector, mapActionsToProps)
export class HostMacList extends Component {
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
    const { loadHostMacs } = this.props.actions;

    if (host_id === undefined) {
      return;
    }

    if (!this.state.isFetching) {
      this.setState({isFetching: true});
      loadHostMacs(host_id)
        .then(() => {
          this.setState({isFetching: false});
        });
    }
  }

  handleSubmit(formData) {
    const { host_id } = this.props;
    const data = {
      ...formData,
      type: 'host_mac',
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

  handleDelete(mac) {
    const { host_id, actions: { deleteItem } } = this.props;
    deleteItem(mac)
      .then(() => {
        this.reloadData(host_id);
      })
      .catch((e) => {
        console.log(e);
      })
  }


  render() {
    const { macs, ...other } = this.props;

    return (
      <View layout='vertical' {...other}>
        <View height={25}>
          <b>MAC Addresses:</b>
        </View>
        <View height={25}>
          <HostMacEditForm
            formKey={'new'}
            className={styles.form}
            btnLabel='Add'
            onSave={this.handleSubmit.bind(this)}
            />
        </View>
        <View style={{overflowY: 'scroll'}}>
          <div>
            <div className={styles.form}>
              <span>Interface</span>
              <span>Addr</span>
              <span>Actions</span>
            </div>
            {macs.length == 0 && this.state.isFetching
              ? <div>Loading...</div> : ''}
            {macs.map(mac => {
              return (
                <HostMacListItem
                  className={styles.form}
                  key={mac.mac_id}
                  mac={mac}
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
