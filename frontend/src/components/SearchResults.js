import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';

import urls from '../urls';
import { Link } from 'react-router';
import Icon from './Icon.js';
import MenuItemGroup from './MenuItemGroup.js';


const searchResultsSelector = state => state.data.search.results;
const searchQuerySelector = state => state.data.search.query;
const searchFetchingSelector = state => state.data.search.fetching;
const itemsSelector = createSelector(
  searchResultsSelector,
  searchQuerySelector,
  searchFetchingSelector,
  (results, query, fetching) => {
    return {
      results,
      query,
      fetching,
    }
  }
);

@connect(itemsSelector)
export default class SearchResults extends Component {
  render() {
    const { results, query, fetching } = this.props;

    if (query.length < 3) {
      return (
        <ul {...this.props}>
          <li>Запрос должен быть не короче 3-х символов.</li>
        </ul>
      );
    }

    if (results.length == 0) {
      return (
        <ul {...this.props}>
          <li>{fetching ? 'Loading...' : 'Ничего не найдено.'}</li>
        </ul>
      );
    }

    return (
      <ul {...this.props}>
        {results.map(r => {
          switch (r.type) {
            case 'host_ip':
              return <li key={'host_ip'+r.ip_id}><Link to={urls.host.show(r.host_id)}><Icon name='cloud' fixedWidth />{r.addr}</Link></li>;
            case 'host':
              return <li key={'host'+r.host_id}><Link to={urls.host.show(r.host_id)}><Icon name='server' fixedWidth />{r.name}</Link></li>;
            case 'group':
              return <MenuItemGroup key={'group'+r.group_id} group_id={r.group_id} group={r} />;
            default:
              return '';
          }
        })}
      </ul>
    );
  }
}
