import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';

import urls from '../urls';
import { Link } from 'react-router';
import Icon from './Icon.js';


const searchQuerySelector = state => state.data.search.query;
const itemsSelector = createSelector(
  searchQuerySelector,
  (query) => {
    return {
      query,
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
    const { query } = this.props;

    return (
      <div {...this.props}>
        <Icon name='search' fixedWidth />
        <input type='text' placeholder='search...' value={query} onChange={this.handleQueryChange.bind(this)}/>
        {query.length > 0 ? <Icon className='clickable' name='times' fixedWidth onClick={this.handleQueryClear.bind(this)} /> : ''}
      </div>
    );
  }
}
