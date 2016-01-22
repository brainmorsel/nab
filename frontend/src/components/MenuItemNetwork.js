import React, { Component, PropTypes } from 'react';
import MenuItem from './MenuItem';
import Icon from './Icon.js';

import { Link } from 'react-router';
import urls from '../urls';


export default class MenuItemNetwork extends Component {
  constructor(props) {
    super(props);
    this.state = {isOpen: false, isFetching: false};
  }

  componentDidMount() {
  }

  handleToggle() {
    if (!this.state.isOpen) {
      this.handleReload();
    }
    this.setState({isOpen: !this.state.isOpen});
  }

  handleReload() {
    const { loadNetworkItems, network_id } = this.props;

    if (!this.state.isFetching) {
      this.setState({isFetching: true});
      loadNetworkItems(network_id).then(() => {
        this.setState({isFetching: false});
      });
    }
  }

  handleClick() {
    const { onClick, group_id } = this.props;

    if (!this.state.isOpen) {
      this.handleToggle();
    }
  }

  render() {
    const { getItemData, name, network_id, items } = this.props;
    const { isOpen, isFetching } = this.state;
    const curItem = getItemData({type: 'network', network_id})||{};
    const iconName = this.props.iconName || 'folder';

    const hoverButtons = (
      <Icon fixedWidth name='refresh' onClick={this.handleReload.bind(this)} className='reload' title='Обновить'/>
    );

    return (
      <MenuItem
        label={<Link to={urls.network.show(network_id)}><Icon name={iconName} fixedWidth/>{name}</Link>}
        canHasChildren
        isOpen={isOpen}
        isFetching={isFetching}
        onToggle={this.handleToggle.bind(this)}
        onClick={this.handleClick.bind(this)}
        hoverButtons={hoverButtons}
        >
            { items && items.length > 0
                ? items.map(item => (()=>{
                  let {network_id, name, addr, children} = getItemData(item);
                  let label = `${name} (${addr})`;
                  return <MenuItemNetwork {...this.props} key={`network${network_id}`} network_id={network_id} name={label} items={children}/>
                })())
                : <li>{isFetching ? 'Загрузка...' : 'Пока ничего нет.'}</li>
            }
      </MenuItem>
    );

  }
}
