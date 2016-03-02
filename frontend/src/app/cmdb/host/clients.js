import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { pushPath } from 'redux-simple-router';
import { Route, IndexRoute } from 'react-router';
import { createSelector } from 'reselect';
import classNames from 'classnames';

import * as cmdbSelectors from 'app/cmdb/selectors';
import * as selectors from './selectors';
import * as actions from 'app/cmdb/actions';

import styles from './clients.css';
import { View } from 'ui/layout';
import Icon from 'ui/widgets/icon';


function mapActionsToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

const selector = createSelector(
  selectors.hostIdFromParams,
  selectors.currentHost,
  (host_id, host) => {
    return {
      host_id,
      host,
    }
  }
);

@connect(selector, mapActionsToProps)
export class HostClients extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const { host_id, actions: { loadHostClients } } = this.props;

    loadHostClients(host_id);
  }

  render() {
    const { host_id, host, ...other } = this.props;

    return (
      <View {...other} style={{overflowY: 'scroll'}}>
        <div>
          <div  className={styles.item}>
            <span className={styles.fieldPort}>Port</span>
            <span>Type</span>
            <span>Name</span>
            <span>Description</span>
            <span>MAC</span>
            <span>Last session IP</span>
            <span className={styles.fieldSession} title='Session'>S</span>
            <span className={styles.fieldIPTV} title='IPTV'>TV</span>
            <span>Last update</span>
          </div>
          {host && host.clients && host.clients.map(client => {
            const isSessionActive = !client.session.time_end;
            const isHasTV = !!client.igmp.profile_id;
            const isActiveTV = isHasTV && client.igmp.active;
            return (
              <div key={client.port_id} className={styles.item}>
                <span className={styles.fieldPort}>{client.port_id}</span>
                <span>{client.client_type_name}</span>
                <span>{client.name}</span>
                <span>{client.description}</span>
                <span>{client.client_mac.toUpperCase()}</span>
                <span>{client.session.client_ip}</span>
                <span
                  className={classNames(styles.fieldSession, isSessionActive ? styles.active : styles.inactive)}
                  title={client.session.time_start + ' - ' + (client.session.time_end || 'now')}
                  >
                  <Icon name='plug'/>
                </span>
                <span
                  className={classNames(styles.fieldIPTV, isActiveTV ? styles.active : styles.inactive)}
                  title={isHasTV ? 'last change '+client.igmp.update_time : ''}
                  >
                  {isHasTV && <Icon name='tv' />}
                </span>
                <span>{client.update_time}</span>
              </div>
            );
          })}
        </div>
      </View>
    );
  }
}

