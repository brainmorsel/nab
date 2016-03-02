import React, { Component, PropTypes } from 'react';
import Icon from 'ui/widgets/icon';
import { Link } from 'react-router';
import urls from 'app/urls';


export const GroupTypeLabel = (props) => {
  const { isLink, item, ...other } = props;
  const { name, group_type_id } = item;
  const icon_name = item.icon_name || 'folder';

  return (
    isLink
      ? <Link to={urls.cmdb.group_type.show(group_type_id)} {...other}><Icon name={icon_name} fixedWidth/>{name}</Link>
      : <span {...other}><Icon name={icon_name} fixedWidth/>{name}</span>
  );
};
