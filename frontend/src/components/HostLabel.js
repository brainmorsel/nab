import React, { Component, PropTypes } from 'react';
import Icon from './Icon.js';
import { Link } from 'react-router';
import urls from '../urls';


export default class HostLabel extends Component {
  render() {
    const { name, host_id } = this.props.host;
    const { isLink, onClick } = this.props;

    if (isLink) {
      return (
        <Link to={urls.host.show(host_id)} onClick={onClick}><Icon name='server' fixedWidth/>{name}</Link>
      );
    } else {
      return (
        <span onClick={onClick}><Icon name='server' fixedWidth/>{name}</span>
      );
    }
  }
}
