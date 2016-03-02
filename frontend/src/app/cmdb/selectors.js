import { createSelector } from 'reselect';

const mapToArray = (object) => { return Object.keys(object).map(key => object[key]) };

export const hosts = state => state.app.cmdb.hosts;
export const hostsIps = state => state.app.cmdb.host_ips;
export const hostsMacs = state => state.app.cmdb.host_macs;
export const groups = state => state.app.cmdb.groups;
export const networks = state => state.app.cmdb.networks;
export const groupTypes = state => state.app.cmdb.group_types;
export const hostTypes = state => state.app.cmdb.host_types;
export const clientTypes = state => state.app.cmdb.client_types;
export const rootGroups = state => state.app.cmdb.root.groups;
export const rootNetworks = state => state.app.cmdb.root.networks;
export const groupTypesList = createSelector(groupTypes, mapToArray);
export const hostTypesList = createSelector(hostTypes, mapToArray);
export const clientTypesList = createSelector(clientTypes, mapToArray);
export const networksAllIds = state => state.app.cmdb.networks_all;
export const networksAllList = createSelector(
  networks,
  networksAllIds,
  (networks, ids) => {
    return ids.map(id => networks[id]);
  }
);
export const currentGroupPath = state => state.app.cmdb.groups_current_path;
