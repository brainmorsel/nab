import { createSelector } from 'reselect';

export const problemHosts = state => state.app.events.problem_hosts.list;
export const problemHostsFetchPeriod = state => state.app.events.problem_hosts.fetch_period;
