import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';

import * as selectors from 'app/cmdb/selectors';
import * as actions from 'app/cmdb/actions';

import { TreeItem } from './item';
import Icon from 'ui/widgets/icon';
import { NetworkLabel } from 'app/cmdb/network/label';


const networkSelector = (state, props) => props.network;
const itemsSelector = createSelector(
  selectors.networks,
  networkSelector,
  (networks, network) => {
    const children = (network || {}).children;
    return {
      networks,
      network,
      children,
    }
  }
);

function mapActionsToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

@connect(itemsSelector, mapActionsToProps)
export class TreeItemNetwork extends Component {
  constructor(props) {
    super(props);
    this.state = {isOpen: false, isFetching: false};
  }

  handleToggle() {
    if (!this.state.isOpen) {
      this.handleReload();
    }
    this.setState({isOpen: !this.state.isOpen});
  }

  handleReload() {
    const { actions: { loadNetworkChildren }, network } = this.props;

    if (!this.state.isFetching) {
      this.setState({isFetching: true});
      loadNetworkChildren(network.network_id).then(() => {
        this.setState({isFetching: false});
      });
    }
  }

  handleClick() {
    const { onClick } = this.props;

    if (!this.state.isOpen) {
      this.handleToggle();
    }
  }

  render() {
    const { isOpen, isFetching } = this.state;
    const { children, network, networks } = this.props;

    const hoverButtons = [
      <Icon key='reload' fixedWidth name='refresh' onClick={this.handleReload.bind(this)} title='Обновить'/>
    ];

    return (
      <TreeItem
        label={<NetworkLabel isLink item={network}/>}
        // title={curItem.group_type_name}
        canHasChildren
        isOpen={isOpen}
        isFetching={isFetching}
        onToggle={this.handleToggle.bind(this)}
        onClick={this.handleClick.bind(this)}
        hoverButtons={hoverButtons}
        >
          { children && children.length > 0
              ? children.map(item => (()=>{
                const net = networks[item.network_id];

                return <TreeItemNetwork key={item.network_id} network={net} />
              })())
              : <li>{isFetching ? 'Загрузка...' : 'Пока ничего нет.'}</li>
          }
      </TreeItem>
    );
  }
}
