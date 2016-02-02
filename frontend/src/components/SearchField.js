import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';
import classNames from 'classnames';

import urls from '../urls';
import { Link } from 'react-router';
import Icon from './Icon.js';


const searchQuerySelector = state => state.data.search.query;
const searchFetchingSelector = state => state.data.search.fetching;
const itemsSelector = createSelector(
  searchQuerySelector,
  searchFetchingSelector,
  (query, fetching) => {
    return {
      query,
      fetching,
    }
  }
);

function mapActionsToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

@connect(itemsSelector, mapActionsToProps)
export default class SearchField extends Component {
  handleQueryChange(e) {
    const { loadSearchResults } = this.props.actions;

    loadSearchResults(e.target.value);
  }

  handleQueryClear() {
    const { loadSearchResults } = this.props.actions;

    loadSearchResults('');
  }

  render() {
    const { query, fetching, className } = this.props;
    const showClearBtn = query.length > 0;

    return (
      <div {...this.props} className={classNames(className, 'control is-withicon', {'is-grouped': showClearBtn})}>
        <input className='input' type='text' placeholder='search...' value={query} onChange={this.handleQueryChange.bind(this)}/>
        <Icon name='search'/>
        <button
          style={{display: showClearBtn ? '' : 'none'}}
          className='button'
          onClick={this.handleQueryClear.bind(this)}
          >
            <Icon name='times' fixedWidth/>
          </button>
      </div>
    );
  }
}
