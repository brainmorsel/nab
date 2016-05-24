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
import { Table } from 'ui/widgets/table';


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

  componentWillReceiveProps(nextProps) {
    const { host_id, actions: { loadHostClients } } = this.props;
    if (host_id != nextProps.host_id) {
      loadHostClients(nextProps.host_id);
    }
  }

  render() {
    const { host_id, host, ...other } = this.props;

    const columns = [
      {
        field: 'port_id',
        label: 'Port',
        width: '50px',
      },
      {
        field: 'client_type_name',
        label: 'Type',
        width: '100px',
      },
      {
        field: 'name',
        width: '150px',
      },
      {
        field: 'description',
      },
      {
        field: 'client_mac',
        render: (props, value) => (<div {...props}>{value.toUpperCase()}</div>),
      },
      {
        field: 'session',
        label: 'Last session IP',
        render: (props, value) => (<div {...props}>{value.client_ip}</div>),
      },
      {
        field: 'session',
        label: 'S',
        width: '32px',
        render: (props, value) => {
          const isSessionActive = !value.time_end;
          return <div {...props}
            className={isSessionActive ? styles.active : styles.inactive}
            title={value.time_start + ' - ' + (value.time_end || 'now')}
            >
            <Icon name='plug'/>
          </div>
        },
      },
      {
        field: 'igmp',
        label: 'TV',
        width: '32px',
        render: (props, value) => {
          const isHasTV = !!value.profile_id;
          const isActiveTV = isHasTV && value.active;
          return <div {...props}
            className={isActiveTV ? styles.active : styles.inactive}
            title={isHasTV ? 'last change '+value.update_time : ''}
            >
            {isHasTV && <Icon name='tv' />}
          </div>
        },
      },
      {
        field: 'update_time',
        width: '180px',
      },
    ];

    return (
      <View {...other}>
          {host && host.clients && <Table columns={ columns } data={ host.clients } />}
      </View>
    );
  }
}

