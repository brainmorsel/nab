import './MenuItem.css';
import React, { Component, PropTypes } from 'react';
import Icon from './Icon.js';
import MenuItem from './MenuItem';

import { Link } from 'react-router';
import urls from '../urls';


export default class MenuItemGroupTypes extends Component {
  constructor(props) {
    super(props);
    this.state = {isOpen: false, isFetching: false};
  }

  componentDidMount() {
    this.handleReload();
  }

  handleToggle() {
    if (!this.state.isOpen) {
      this.handleReload();
    }
    this.setState({isOpen: !this.state.isOpen});
  }

  handleReload() {
    const { getData } = this.props;

    if (!this.state.isFetching) {
      this.setState({isFetching: true});
      getData().then((items) => {
        this.setState({isFetching: false});
      });
    }
  }

  handleClick() {
    if (!this.state.isOpen) {
      this.handleToggle();
    }
  }
  
  render() {
    const { name, iconName, items } = this.props;
    const { isOpen, isFetching } = this.state;

    const hoverButtons = [
      <Icon key='reload' fixedWidth name='refresh' onClick={this.handleReload.bind(this)} className='reload' title='Обновить'/>
    ];

    return (
      <MenuItem
        label={<Link to={urls.group_type.show()}><Icon name={iconName} fixedWidth/>{name}</Link>}
        canHasChildren
        isOpen={isOpen}
        isFetching={isFetching}
        onToggle={this.handleToggle.bind(this)}
        onClick={this.handleClick.bind(this)}
        hoverButtons={hoverButtons}
        >
            { items && items.length > 0
                ? items.map(item =>
                  <MenuItem
                    label={<Link to={urls.group_type.show(item.group_type_id)}><Icon name={item.icon_name} fixedWidth/>{item.name}</Link>}
                    key={item.group_type_id}
                    />
                )
                : <li>{isFetching ? 'Загрузка...' : 'Пока ничего нет.'}</li>
            }
      </MenuItem>
    );
  }
}
