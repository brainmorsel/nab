import { createSelector } from 'reselect';

import * as cmdbSelectors from 'app/cmdb/selectors';

export const hostIdFromParams = (state, props) => props.params.host_id;

export const currentHost = createSelector(
  hostIdFromParams,
  cmdbSelectors.hosts,
  (hostId, hosts) => {
    return hosts[hostId];
  }
);
