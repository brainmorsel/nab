import React, { Component, PropTypes } from 'react';

import urls from '../urls';
import { Link } from 'react-router';
import FormButtonConfirm from './FormButtonConfirm.js';


export default class ItemNetwork extends Component {
  renderChildren(item) {
    return React.Children.map(
      this.props.children,
      child => React.cloneElement(child, {
        actions: this.props.actions,
        navigate: this.props.navigate,
        item: item,
      })
    );
  }

  handleDelete() {
    const { network_id } = this.props.params;
    const { deleteNetwork } = this.props.actions;
    const { navigate, getItemData } = this.props;
    const item = getItemData({type: 'network', network_id});

    deleteNetwork(item)
      .then(() => {
        navigate(urls.network.show(item.parent_id));
      })
      .catch((e) => {/*ignore*/})
  }

  render() {
    const { network_id } = this.props.params;
    const { getItemData } = this.props;
    const item = getItemData({type: 'network', network_id});

    return (
      item
        ? <div>
            <b>{item.name}</b>
            <hr/>
            <div>
              [
              <Link to={urls.network.show(item.network_id)}>Show</Link>|
              <Link to={urls.network.edit(item.network_id)}>Edit</Link>|
              <Link to={urls.network.create(item.network_id)}>Create network</Link>
              ]
              <FormButtonConfirm onClick={this.handleDelete.bind(this)}>Delete</FormButtonConfirm>
            </div>
            {this.renderChildren(item)}
          </div>
        : <div>Loading...</div>
    );
  }
}
