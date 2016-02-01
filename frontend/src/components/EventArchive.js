import React, { Component, PropTypes } from 'react';
import { findDOMNode } from 'react-dom';
import { connect } from 'react-redux';
import * as actions from '../actions';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';
import classNames from 'classnames';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';

import urls from '../urls';
import { Link } from 'react-router';
import GroupBreadcrumbs from './GroupBreadcrumbs.js';
import FormButton from './FormButton.js';


const eventsSelector = state => state.data.events_archive.items;
const selectionSelector = state => state.data.events_archive.selection;
const hostsSelector = state => state.data.hosts;
const startTimeSelector = state => state.data.events_archive.start_time;
const endTimeSelector = state => state.data.events_archive.end_time;
const hostIdSelector = (state, props) => props.params.host_id;
const filterSeveritySelector = state => state.data.events_archive.filter.severity;

const filtersSelector = createSelector(
  filterSeveritySelector,
  (severity) => {
    return {
      severity
    }
  }
);

const filteredEventsSelector = createSelector(
  eventsSelector,
  filtersSelector,
  (events, filters) => {
    const { severity } = filters;
    return events.filter(ev => {
      if (severity && severity != ev.severity) {
        return false;
      }

      return true;
    });
  }
);

const selectedSelector = createSelector(
  selectionSelector,
  (selection) => {
    return Object.keys(selection).filter(k => selection[k]);
  }
);

const itemsSelector = createSelector(
  filteredEventsSelector,
  hostsSelector,
  startTimeSelector,
  endTimeSelector,
  selectionSelector,
  selectedSelector,
  filtersSelector,
  (events, hosts, start_time, end_time, selection, selected, filters) => {
    return {
      events: events.map(ev => ({
        ...ev,
        _host: hosts[ev.host_id],
        _selected: !!selection[ev.event_id],
      })),
      start_time,
      end_time,
      selected,
      filters,
    }
  }
);

function mapActionsToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

@connect(itemsSelector, mapActionsToProps)
export default class EventArchive extends Component {
  componentDidMount() {
    const { actions: { loadEventsArchive, dataEventsArchiveStartTimeSet, dataEventsArchiveEndTimeSet } } = this.props;
    const { start_time, end_time } = this.props;

    if (!start_time) {
      dataEventsArchiveStartTimeSet(Datetime.moment().subtract(1,'hour'));
    }

    if (!end_time) {
      dataEventsArchiveEndTimeSet(Datetime.moment());
    }

    loadEventsArchive();
  }

  handleChangeStartTime(new_time) {
    const { actions: { dataEventsArchiveStartTimeSet } } = this.props;

    dataEventsArchiveStartTimeSet(new_time);
  }

  handleChangeEndTime(new_time) {
    const { actions: { dataEventsArchiveEndTimeSet } } = this.props;

    dataEventsArchiveEndTimeSet(new_time);
  }

  handleReaload() {
    const { actions: { loadEventsArchive } } = this.props;

    loadEventsArchive();
  }

  toggleSelection(ev) {
    const { actions: { dataEventsArchiveSelectionAdd, dataEventsArchiveSelectionRemove } } = this.props;

    if (ev._selected) {
      dataEventsArchiveSelectionRemove(ev.event_id);
    } else {
      dataEventsArchiveSelectionAdd(ev.event_id);
    }
  }

  handleChangeFilterSeverity(e) {
    this.props.actions.dataEventsArchiveFilterSeveritySet(1*e.target.value);
  }

  render() {
    const { events, start_time, end_time, selected, filters } = this.props;
    const severity_levels = {
      0: 'all',
      1: 'unknown',
      2: 'info',
      3: 'warning',
      4: 'critical',
      5: 'ok',
    };


    return (
      <div className='events-archive'>
        <div className='controls'>
          <Datetime dateFormat='YYYY-MM-DD' value={start_time} closeOnSelect onChange={this.handleChangeStartTime.bind(this)}/>
          <Datetime dateFormat='YYYY-MM-DD' value={end_time} closeOnSelect onChange={this.handleChangeEndTime.bind(this)}/>
          <FormButton onClick={this.handleReaload.bind(this)}>Show</FormButton>
          <div>Events: {events.length} Selected: {selected.length}</div>
        </div>
        <div className='list-header'>
          <div className='checkbox'></div>
          <div className='hostname'>
            hostname
          </div>
          <div className='service'>
            service
          </div>
          <div className='time'>
            time
          </div>
          <div className='severity'>
            <select size='1' value={filters.severity} onChange={this.handleChangeFilterSeverity.bind(this)}>
              {Object.keys(severity_levels).map(lvl => <option key={lvl} value={lvl} className={severity_levels[lvl]}>{severity_levels[lvl]}</option>)}
            </select>
          </div>
        </div>
        <EventList events={events} rowHeight={25} onCheckboxClick={this.toggleSelection.bind(this)} />
      </div>
    );
  }
}

class EventList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      skipN: 0,
      showN: 0,
      skipHeight: 0,
      remainHeight: 0,
    };
  }

  componentWillReceiveProps(nextProps) {
    this.calcVisibleItems(nextProps.events.length);
  }

  componentDidMount() {
    this._node = findDOMNode(this);
    this.calcVisibleItems(this.props.events.length);
  }

  handleScroll(e) {
    this.calcVisibleItems(this.props.events.length);
  }

  calcVisibleItems(totalN) {
    const { rowHeight } = this.props;
    const scrollTop = this._node.scrollTop;
    const clientHeight = this._node.clientHeight;

    const skipN = Math.floor(scrollTop / rowHeight);
    const skipHeight = skipN * rowHeight;
    const peekingHeight = scrollTop - skipHeight;

    const showN = Math.ceil((peekingHeight + clientHeight) / rowHeight);
    const visibleHeight = showN * rowHeight;
    const remainHeight = rowHeight * Math.max(0, (totalN - (skipN + showN)));

    this.setState({
      skipN,
      showN,
      skipHeight,
      remainHeight,
    });
  }

  render() {
    const { events, rowHeight, onCheckboxClick } = this.props;
    const { skipN, showN, skipHeight, remainHeight } = this.state;

    const totalN = events.length;
    let items = [];
    for (let i = skipN, to = Math.min(skipN + showN, totalN); i < to; i++) {
      items.push(
        <EventItem
          key={events[i].event_id}
          ev={events[i]}
          rowHeight={rowHeight}
          idx={i}
          onCheckboxClick={onCheckboxClick}
          />
      );
    }

    return (
      <div {...this.props} className='events-list' onScroll={this.handleScroll.bind(this)}>
        <div style={{height: skipHeight}} />
        {items}
        <div style={{height: remainHeight}} />
      </div>
    );
  }
}

class EventItem extends Component {
  render() {
    const { ev, rowHeight, idx, onCheckboxClick } = this.props;
    const severity_levels = {
      1: 'unknown',
      2: 'info',
      3: 'warning',
      4: 'critical',
      5: 'ok',
    };

    const host = ev._host;
    const severity = severity_levels[ev.severity];

    if (host) {
      return (
        <div className={classNames('item', (idx % 2 == 0 ? 'even' : 'odd'))} style={{height: rowHeight, overflow: 'hidden'}}>
          <div className='checkbox'>
            <input type='checkbox' checked={ev._selected} onChange={() => onCheckboxClick(ev)} />
          </div>
          <div className='hostname'>
            <GroupBreadcrumbs group_id={host.group_id} simple>
              <Link to={urls.host.show(host.host_id)}>{host.name}</Link>
            </GroupBreadcrumbs>
          </div>
          <div className='service'>
            {ev.service_type}
          </div>
          <div className='time'>
            {ev.event_time}
          </div>
          <div className={classNames('severity', severity)}>
            {severity}
          </div>
        </div>
      );
    } else {
      return <div key={ev.event_id} className='item'>Loading...</div>;
    }
  }
}
