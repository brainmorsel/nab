import React, { Component, PropTypes } from 'react';
import Icon from 'ui/widgets/icon';
import { Link } from 'react-router';
import urls from 'app/urls';


export const HostLabel = (props) => {
  const { isLink, item, ...other } = props;
  const { name, host_id, description } = item;
  const icon_name = 'server';

  return (
    isLink
      ? <Link to={urls.cmdb.host.show(host_id)} title={description} {...other}>
          <Icon name={icon_name} fixedWidth/>
          { description && <Icon name='comment-o' /> }
          {name}
        </Link>
      : <span {...other} title={description}>
          <Icon name={icon_name} fixedWidth/>
          { description && <Icon name='comment-o' /> }
          {name}
        </span>
  );
};
