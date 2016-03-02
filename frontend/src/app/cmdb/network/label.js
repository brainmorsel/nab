import React, { Component, PropTypes } from 'react';
import Icon from 'ui/widgets/icon';
import { Link } from 'react-router';
import urls from 'app/urls';


export const NetworkLabel = (props) => {
  const { isLink, item, ...other } = props;
  const { name, network_id } = item;
  const icon_name = 'asterisk';

  return (
    isLink
      ? <Link to={urls.cmdb.network.show(network_id)} {...other}><Icon name={icon_name} fixedWidth/>{name}</Link>
      : <span {...other}><Icon name={icon_name} fixedWidth/>{name}</span>
  );
};
