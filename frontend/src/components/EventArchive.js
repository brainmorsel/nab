import React, { Component, PropTypes } from 'react';
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
const hostsSelector = state => state.data.hosts;
const groupsSelector = state => state.data.groups;
const startTimeSelector = state => state.data.events_archive.start_time;
const endTimeSelector = state => state.data.events_archive.end_time;
const itemsSelector = createSelector(
  eventsSelector,
  hostsSelector,
  groupsSelector,
  startTimeSelector,
  endTimeSelector,
  (events, hosts, groups, start_time, end_time) => {
    return {
      events,
      hosts,
      groups,
      start_time,
      end_time,
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
      dataEventsArchiveStartTimeSet(Datetime.moment().subtract(1,'day'));
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

  render() {
    const { events, hosts, start_time, end_time } = this.props;

    return (
      <div>
        <div className='events-list-controls'>
          <Datetime dateFormat='YYYY-MM-DD' value={start_time} closeOnSelect onChange={this.handleChangeStartTime.bind(this)}/>
          —
          <Datetime dateFormat='YYYY-MM-DD' value={end_time} closeOnSelect onChange={this.handleChangeEndTime.bind(this)}/>
          <FormButton onClick={this.handleReaload.bind(this)}>Show</FormButton>
        </div>
        <hr />
        <EventList events={events} hosts={hosts} />
      </div>
    );
  }
}

class EventList extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    return (this.props.events != nextProps.events || this.props.hosts != nextProps.hosts);
  }

  render() {
    const { events, hosts } = this.props;
    const severity_levels = {
      1: 'unknown',
      2: 'info',
      3: 'warning',
      4: 'critical',
      5: 'ok',
    };

    return (
      <div className='events-list'>
        {events.map(ev => {
          const host = hosts[ev.host_id];
          const severity = severity_levels[ev.severity];

          if (host) {
            return (
              <div key={ev.event_id} className='item'>
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
            return '';
          }
        })}
      </div>
    );
  }
}
