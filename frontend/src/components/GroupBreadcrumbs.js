import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';

import GroupLabel from './GroupLabel.js';
import urls from '../urls';
import { Link } from 'react-router';


const groupsSelector = state => state.data.groups;
const startGroupIdSelector = (state, props) => props.group_id;
const itemsSelector = createSelector(
  groupsSelector,
  startGroupIdSelector,
  (groups, start_id) => {
    let next_id = start_id;
    let items = [];

    while (next_id) {
      if (groups[next_id]) {
        let item = groups[next_id];
        next_id = item.parent_id;
        items.push(item);
      } else {
        next_id = null;
      }
    }
    items = items.reverse();

    return {
      groups,
      items,
    }
  }
);

function mapActionsToProps(dispatch) {
  return {
    getItemData: bindActionCreators(actions.getItemDataAsync, dispatch),
  };
}

/* Компонент рисует "хлебные крошки" для групп. */
@connect(itemsSelector, mapActionsToProps)
export default class GroupBreadcrumbs extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.items != nextProps.items) {
      return true;
    }

    return false;
  }

  componentDidMount() {
  }

  render() {
    const { items, simple } = this.props;

    if (simple) {
      const text = items.map(i => i.name + ' / ').join('');

      return (
        <div>
          {text}
          {this.props.children}
        </div>
      );
    }
    return (
      <div>
        {items.map(item => <span key={item.group_id}>
            <GroupLabel isLink group={item}/> / </span>
            )}
        {this.props.children}
      </div>
    );
  }
}
