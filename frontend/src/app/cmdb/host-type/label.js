import React, { Component, PropTypes } from 'react';
import Icon from 'ui/widgets/icon';
import { Link } from 'react-router';
import urls from 'app/urls';


export const HostTypeLabel = (props) => {
  const { isLink, item, ...other } = props;
  const { name, host_type_id } = item;
  const icon_name = 'server';

  return (
    isLink
      ? <Link to={urls.cmdb.host_type.show(host_type_id)} {...other}><Icon name={icon_name} fixedWidth/>{name}</Link>
      : <span {...other}><Icon name={icon_name} fixedWidth/>{name}</span>
  );
};
