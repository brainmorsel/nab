import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import { createSelector } from 'reselect';

import * as cmdbSelectors from 'app/cmdb/selectors';
import { GroupLabel } from './label';


const startGroupIdSelector = (state, props) => props.group_id;
const showRootSeletor = (state, props) => props.showRoot;
const itemsSelector = createSelector(
  cmdbSelectors.groups,
  startGroupIdSelector,
  showRootSeletor,
  (groups, start_id, showRoot) => {
    let next_id = start_id;
    let items = [];

    while (next_id) {
      if (groups[next_id]) {
        let item = groups[next_id];
        if (!item) {
          break;
        }
        next_id = item.parent_id;
        items.push(item);
      } else {
        next_id = null;
      }
    }
    if (showRoot) {
      items.push({name: 'Хосты'});
    }
    items = items.reverse();

    return {
      groups,
      items,
    }
  }
);

/* Компонент рисует "хлебные крошки" для групп. */
@connect(itemsSelector)
export class GroupBreadcrumbs extends Component {
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
        {items.map(item =>
          <span key={item.group_id || null}>
            <GroupLabel isLink item={item}/> / </span>
        )}
        {this.props.children}
      </div>
    );
  }
}
