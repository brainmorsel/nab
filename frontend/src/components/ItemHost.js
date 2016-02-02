import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';


import GroupBreadcrumbs from './GroupBreadcrumbs.js';
import FormButtonConfirm from './FormButtonConfirm.js';
import HostIPList from './HostIPList.js';
import HostMACList from './HostMACList.js';
import HostLabel from './HostLabel.js';
import urls from '../urls';
import { Link } from 'react-router';


const hostsSelector = state => state.data.hosts;
const hostIdSelector = (state, props) => props.params.host_id;
const hostTypesSelector = state => state.data.host_types;
const itemsSelector = createSelector(
  hostsSelector,
  hostIdSelector,
  hostTypesSelector,
  (hosts, host_id, hostTypes) => {
    return {
      hosts,
      host_id,
      item: hosts[host_id],
      hostTypes,
    }
  }
);

function mapActionsToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

@connect(itemsSelector, mapActionsToProps)
export default class ItemHost extends Component {
  componentDidMount() {
    const { host_id, item, actions: { loadHostsBatch } } = this.props;
    if (!item) {
      loadHostsBatch([host_id, ])
        .catch(e => { console.log('ERROR:', e) });
    }
  }

  componentWillReceiveProps(nextProps) {
    const { host_id, item, actions: { loadHostsBatch } } = nextProps;
    if (!item) {
      loadHostsBatch([host_id, ])
        .catch(e => { console.log('ERROR:', e) });
    }
  }

  renderChildren(item) {
    return React.Children.map(
      this.props.children,
      child => React.cloneElement(child, {
        actions: this.props.actions,
        navigate: this.props.navigate,
        hostTypes: this.props.hostTypes,
        item: item,
      })
    );
  }

  handleDelete() {
    const { item, navigate } = this.props;
    const { deleteHost } = this.props.actions;

    deleteHost(item)
      .then(() => {
        navigate(urls.group.show(item.group_id));
      })
  }

  render() {
    const { host_id, item, getItemData } = this.props;

    return (
      item
        ? <div>
            <GroupBreadcrumbs group_id={item.group_id}>
              <HostLabel host={item} />
            </GroupBreadcrumbs>
            <hr />
            <div>
              <Link className='button' to={urls.host.show(item.host_id)}>Show</Link>
              <Link className='button' to={urls.host.edit(item.host_id)}>Edit</Link>
              <Link className='button' to={urls.host.move(item.host_id)}>Move</Link>
              <FormButtonConfirm onClick={this.handleDelete.bind(this)}>Delete</FormButtonConfirm>
            </div>

            {this.renderChildren(item)}

            <HostIPList host_id={item.host_id}/>

            <HostMACList
              host={item}
              getItemData={getItemData}
              actions={this.props.actions}
              />
          </div>
        : <div>Loading...</div>
    );
  }
}
