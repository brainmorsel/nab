import { createSelector } from 'reselect';

import * as cmdbSelectors from 'app/cmdb/selectors';

export const groupIdFromParams = (state, props) => props.params.group_id;

export const currentGroup = createSelector(
  groupIdFromParams,
  cmdbSelectors.groups,
  (groupId, groups) => {
    return groups[groupId];
  }
);
