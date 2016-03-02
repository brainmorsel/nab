import React, { Component } from 'react';
import { Link } from 'react-router';
import { Route, IndexRoute } from 'react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';

import urls from 'app/urls';
import { View } from 'ui/layout';
import { Table } from 'ui/widgets/table';
import Icon from 'ui/widgets/icon';
import styles from 'app/index.css';
import { GroupBreadcrumbs } from 'app/cmdb/group/breadcrumbs';
import { HostLabel } from 'app/cmdb/host/label';
import { Button } from 'ui/form';
import tableStyles from 'ui/widgets/table.css';

import * as actions from 'app/events/actions';
import * as selectors from 'app/events/selectors';
import * as cmdbSelectors from 'app/cmdb/selectors';


const getHostFullPathText = (host, hosts, groups) => {
  const parts = [];
  parts.push(host.name);
  let g = groups[host.group_id];
  while (g && g.group_id) {
    parts.push(g.name);
    g = groups[g.parent_id];
  }

  return parts.reverse().join(' / ');
};

const itemsSelector = createSelector(
  selectors.problemHosts,
  cmdbSelectors.hosts,
  cmdbSelectors.groups,
  (problemHosts, hosts, groups) => {
    return problemHosts.map(h => {
      const host = hosts[h.host_id];
      return {
        ...h,
        _host: host,
        _path: getHostFullPathText(host, hosts, groups),
      };
    });
  }
);

const selector = createSelector(
  itemsSelector,
  selectors.problemHostsFetchPeriod,
  (problemHosts, fetchPeriod) => {
    return {
      problemHosts,
      fetchPeriod,
    }
  }
);

function mapActionsToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

@connect(selector, mapActionsToProps)
export class Problems extends Component {
  constructor(props) {
    super(props);
    this.state = {isFetching: false};
  }

  componentDidMount() {
    const { fetchPeriod } = this.props;

    this.periodicFetch(fetchPeriod);
  }

  componentWillUnmount() {
    this.periodicFetch(false);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.fetchPeriod != nextProps.fetchPeriod) {
      this.periodicFetch(nextProps.fetchPeriod);
    }
  }

  periodicFetch(period) {
    if (this._timer) {
      clearTimeout(this._timer);
    }
    if (!period) {
      return;
    }
    this.loadData();
    this._timer = setTimeout(this.periodicFetch.bind(this, period), period * 1000);
  }

  loadData() {
    const { actions: { loadProblemHosts } } = this.props;
    const { isFetching } = this.state;

    if (!isFetching) {
      this.setState({isFetching: true});
      loadProblemHosts()
        .then(() => {
          this.setState({isFetching: false});
        });
    }
  }

  handleChangeFetchPeriod(e) {
    this.props.actions.problemHostsFetchPeriodSet(1*e.target.value);
  }

  rowClassFunc(item) {
    const ts = item.last_change_time_ts;
    const delta = Math.round((new Date()) / 1000 - ts);
    if (delta > 3600) {
      return tableStyles.dimm;
    }
  }

  render() {
    const { isFetching } = this.state;
    const { problemHosts, fetchPeriod } = this.props;
    const problemClientsCount = problemHosts
      .filter(h => h.clients_count)
      .map(h => h.clients_count)
      .reduce((a, b) => (a + b), 0);

    const columns = [
      {
        field: 'last_change_time',
        label: 'Status Time',
        width: '250px',
        render: (props, value, item) => (<TimeLabel {...props} time_str={item.last_change_time} time_ts={item.last_change_time_ts} />),
      },
      {
        field: 'clients_count',
        label: 'Clients',
        width: '50px',
        render: (props, value) => (<div {...props}>{value && <Icon name='users'/>} {value}</div>),
      },
      {
        field: '_host',
        label: 'Host',
        flex: 4,
        render: (props, host) => (
            <div {...props}>
              <GroupBreadcrumbs group_id={host.group_id}>
                <HostLabel isLink item={host}/>
              </GroupBreadcrumbs>
            </div>),
      },
      {field: 'addr'},
      {field: 'interface_name'},
      {field: 'status'},
    ];

    const fetchPeriodVariants = [3, 5, 10, 15, 30, 60];

    return (
      <View {...this.props} layout='vertical'>
        <View height={30}>
          <div>
            <Button disabled={isFetching} onClick={this.loadData.bind(this)}>
              Refresh
            </Button> every <select size='1' value={fetchPeriod} onChange={this.handleChangeFetchPeriod.bind(this)}>
              {fetchPeriodVariants.map(t => <option key={t} value={t}>{t}</option>)}
            </select> sec.
            Hosts: { problemHosts.length } Clients: { problemClientsCount }
          </div>
        </View>
        <Table columns={ columns } data={ problemHosts } rowClassFunc={this.rowClassFunc.bind(this)} />
      </View>
    );
  }
}

class TimeLabel extends Component {
  render() {
    const padZeros = (n, len=2) => {
      return String("00000" + n).slice(-len);
    };
    const { time_str, time_ts, ...other } = this.props;
    const delta = Math.round((new Date()) / 1000 - time_ts);
    const secs = Math.floor(delta % 60);
    const mins = Math.floor((delta / 60) % 60);
    const hours = Math.floor((delta / 3600) % 24);
    const days = Math.floor(delta / (3600 * 24));

    let delta_str;
    if (days > 0) {
      delta_str = `(${days}d ago)`;
    } else if (hours > 0) {
      delta_str = `(${hours}h ago)`;
    } else if (mins > 0) {
      delta_str = `(${mins}m ago)`;
    } else if (secs > 0) {
      delta_str = `(${secs}s ago)`;
    }
    return (
        <div {...other}>{time_str} {delta_str}</div>
    );
  }
}

const Index = (props) => <View {...props}><div>Index page</div></View>;

export const route = (path) => {
  return (
    <Route path={path} component={Problems} />
  );
};
