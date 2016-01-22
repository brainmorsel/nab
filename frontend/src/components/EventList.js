import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';
import classNames from 'classnames';

import urls from '../urls';
import { Link } from 'react-router';
import Icon from './Icon.js';
import GroupBreadcrumbs from './GroupBreadcrumbs.js';
import HostLabel from './HostLabel.js';

const hostsSelector = (state) => state.data.hosts;
const eventsAllSelector = (state) => state.data.events.list;
const fetchPeriodSelector = state => state.data.events.fetchPeriod;
const filterTypeSelector = state => state.data.events.filterType;
const filterAddrSelector = state => state.data.events.filterAddr;
const lastUpdateSelector = state => state.data.events.lastUpdate;

const eventsByTypeSelector = createSelector(
  eventsAllSelector,
  filterTypeSelector,
  (events, filterType) => {
    return (
      events
        .map(e => {
          let ev = Object.create(e);
          switch (filterType) {
            case 'all':
              ev._show = true;
              break;
            case 'alive':
              ev._show = e.to == 'alive';
              break;
            case 'unreachable':
              ev._show = e.to == 'unreachable';
              break;
          }
          return ev;
        })
    );
  }
);

const eventsSelector = createSelector(
  eventsByTypeSelector,
  filterAddrSelector,
  (events, filterAddr) => {
    return (
      events
        .map(e => {
          let ev = Object.create(e);
          if (filterAddr == '') {
            ev._show = e._show && true;
          } else {
            ev._show = e._show && (-1 != e.addr.indexOf(filterAddr));
          }
          return ev;
        })
    );
  }
);

const itemsSelector = createSelector(
  fetchPeriodSelector,
  filterTypeSelector,
  filterAddrSelector,
  (fetchPeriod, filterType, filterAddr) => {
    return {
      fetchPeriod,
      filterType,
      filterAddr,
    }
  }
);

const eventsListSelector = createSelector(
  hostsSelector,
  eventsSelector,
  lastUpdateSelector,
  (hosts, events, lastUpdate) => {
    return {
      hosts,
      events,
      lastUpdate,
    }
  }
);

function mapActionsToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

@connect(itemsSelector, mapActionsToProps)
export default class EventList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isFetching: false,
    };
  }

  loadData() {
    const { isFetching } = this.state;
    const { actions: { loadIcmpEventsLast } } = this.props;

    if (isFetching) {
      return;
    }

    this.setState({isFetching: true});
    loadIcmpEventsLast()
      .then(data => {
        this.setState({isFetching: false});
      })
      .catch(e => console.log('ERROR:', e))
  }

  periodicUpdate(fetchPeriod) {
    this.loadData();

    if (this._periodicUpdateTimer !== undefined) {
      clearTimeout(this._periodicUpdateTimer);
    }
    this._periodicUpdateTimer = setTimeout(
        this.periodicUpdate.bind(this), 1000*fetchPeriod, fetchPeriod);
  }

  componentWillMount() {
    const { fetchPeriod } = this.props;

    this.periodicUpdate(fetchPeriod);
    this.syncUrlToOptions();
  }

  syncUrlToOptions() {
    const { t, ip, p } = this.props.location.query;
    const { filterType, filterAddr, fetchPeriod } = this.props;

    if (t !== undefined && t != filterType) {
      this.props.actions.dataEventsFilterTypeSet(t);
    }
    if (ip !== undefined && ip != filterAddr) {
      this.props.actions.dataEventsFilterAddrSet(ip);
    }
    if (p !== undefined && p != fetchPeriod) {
      this.props.actions.dataEventsFetchPeriodSet(1*p);
      this.periodicUpdate(1*p);
    }
  }

  syncOptionsToUrl(props) {
    const { history, location, filterType, filterAddr, fetchPeriod } = props;

    const query = [];
    if (filterType != 'all') {
      query.push(`t=${filterType}`);
    }
    if (filterAddr) {
      query.push(`ip=${filterAddr}`);
    }
    if (fetchPeriod != 60) {
      query.push(`p=${fetchPeriod}`);
    }

    let newpath = location.pathname;
    if (query.length > 0) {
      newpath += '?' + query.join('&');
    }

    if (newpath != location.pathname + location.search) {
      history.replace(newpath);
    }
  }

  componentWillUnmount() {
    if (this._periodicUpdateTimer !== undefined) {
      clearTimeout(this._periodicUpdateTimer);
    }
  }

  componentWillReceiveProps(nextProps) {
    this.syncOptionsToUrl(nextProps);
  }

  handleChangeFetchPeriod(e) {
    const fetchPeriod = 1*e.target.value;

    this.props.actions.dataEventsFetchPeriodSet(fetchPeriod);
    this.periodicUpdate(fetchPeriod);
  }

  handleChangeFilterType(filterType) {
    this.props.actions.dataEventsFilterTypeSet(filterType);
  }

  handleChangeFilterAddr(e) {
    this.props.actions.dataEventsFilterAddrSet(e.target.value);
  }

  render() {
    const { fetchPeriod, filterType, filterAddr } = this.props;
    const { isFetching } = this.state;
    const eventFilterVariants = [
      {value: 'all', label: 'all'},
      {value: 'alive', label: 'alive'},
      {value: 'unreachable', label: 'unreach'},
    ];

    return (
      <div>
        <div className='event header'>
          <div className='subevents-toggle'>
            { isFetching
              ? <Icon name='spinner' spin fixedWidth />
              : <Icon name='refresh' fixedWidth onClick={this.loadData.bind(this)} />
            }
            <select size='1' value={fetchPeriod} onChange={this.handleChangeFetchPeriod.bind(this)} title='Период обновления'>
              {[3, 5, 10, 30, 60].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className='hostname'>host</div>
          <div>
            <input placeholder='ip addr' type='search' value={filterAddr} onChange={this.handleChangeFilterAddr.bind(this)} />
          </div>
          <div>Time</div>
          <div>
            <RadioButtonGroup
              name='eventsFilterSelect'
              checkedValue={filterType}
              choices={eventFilterVariants}
              onChange={this.handleChangeFilterType.bind(this)}
            />
          </div>
        </div>

        <EventListList />
      </div>
    );
  }
}


@connect(eventsListSelector)
class EventListList extends Component {
  _shouldComponentUpdate(nextProps, nextState) {
    if (this.props.lastUpdate != nextProps.lastUpdate) {
      return true;
    }
    if (this.props.hosts != nextProps.hosts) {
      return true;
    }
    if (this.props.events != nextProps.events) {
      return true;
    }

    return false;
  }

  render() {
    const { events, hosts } = this.props;

    return (
      <div>
        {events
          .filter(e => e._show)
          .map(event =>
            <EventItem key={event.time} event={event} hosts={hosts}/>)}
      </div>
    );
  }
}

class EventItem extends Component {
  constructor(props) {
    super(props);
    this.state = {isOpen: false};
  }

  handleToggle() {
    this.setState({isOpen: !this.state.isOpen});
  }

  render() {
    const { event } = this.props;
    const { isOpen } = this.state;
    const hosts = this.props.hosts || {};
    const host = hosts[event.host_id];

    return (
      <div className={classNames('event', event.to)} style={{display: event._show === false ? 'none' : ''}}>
        <div className='label'>
          <div className='subevents-toggle' onClick={this.handleToggle.bind(this)}>
            {event.sub && event.sub.length > 0
              ? <span>
                  <Icon name={isOpen ? 'caret-down' : 'caret-right'} fixedWidth/>
                  {event.sub.length}
                </span>
              : ''
            }
          </div>
          <div className='hostname'>
            {host
              ? <GroupBreadcrumbs group_id={host.group_id} simple>
                  <Link to={urls.host.show(host.host_id)}>{host.name}</Link>
                </GroupBreadcrumbs>
              : ''}
          </div>
          <div>{host ? event.addr : ''}</div>
          <div>{event.time_str}</div>
          <div className='status'>{event.from} => {event.to}</div>
        </div>
          {event.sub && event.sub.length > 0 && isOpen
            ? <div className='subevents'>
                {event.sub.map(e => <EventItem key={e.time} event={e} />)}
              </div>
            : ''}
      </div>
    );
  }
}


const RadioButton = React.createClass({
  render: function() {
    const {name, value, checked, label} = this.props;
    
    return (
      <label>
        <input
          type='radio'
          name={name}
          value={value}
          checked={checked}
          onChange={this.handleChange}
        />
        {label}
      </label>
    );
  },
  
  handleChange: function() {
    const {value, onChange} = this.props;
    onChange(value);
  }
});

const RadioButtonGroup = React.createClass({
  propTypes: {
    name: PropTypes.string,
    checkedValue: PropTypes.string,
    choices: PropTypes.array,
    onChange: PropTypes.func,
  },
  
  getDefaultProps: function() {
    return {
      checkedValue: ''
    };
  },
  
  render: function() {
    const {choices, checkedValue, onChange} = this.props;
    
    const choiceItems = choices.map(choice => {
      const {value, label} = choice;
      const checked = value === checkedValue;
      
      return (
        <RadioButton
          key={`radio-button-${value}`}
          label={label}
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
        />
      );
    });
    
    return (
      <span>
        {choiceItems}
      </span>
    );
  }
});
