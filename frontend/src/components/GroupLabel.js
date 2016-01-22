import React, { Component, PropTypes } from 'react';
import Icon from './Icon.js';
import { Link } from 'react-router';
import urls from '../urls';


export default class GroupLabel extends Component {
  render() {
    const { name, icon_name, group_id } = this.props.group;
    const { isLink, onClick } = this.props;

    if (isLink) {
      return (
        <Link to={urls.group.show(group_id)} onClick={onClick}><Icon name={icon_name} fixedWidth/>{name}</Link>
      );
    } else {
      return (
        <span onClick={onClick}><Icon name={icon_name} fixedWidth/>{name}</span>
      );
    }
  }
}
