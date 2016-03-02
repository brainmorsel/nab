import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { pushPath } from 'redux-simple-router';
import { Route, IndexRoute } from 'react-router';
import { createSelector } from 'reselect';

import * as cmdbSelectors from 'app/cmdb/selectors';
import * as selectors from './selectors';
import * as actions from 'app/cmdb/actions';

import styles from 'app/index.css';
import urls from 'app/urls';
import { View } from 'ui/layout';
import { HostLabel } from './label';
import { GroupBreadcrumbs } from 'app/cmdb/group/breadcrumbs';
import { Button } from 'ui/form';
import { HostIPList } from './ip-list';
import { HostMacList } from './mac-list';

function mapActionsToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
    navigate: bindActionCreators(pushPath, dispatch),
  };
}

const selector = createSelector(
  selectors.hostIdFromParams,
  selectors.currentHost,
  cmdbSelectors.networksAllList,
  (host_id, host, networksAllList) => {
    return {
      host_id,
      host,
      networksAllList,
    }
  }
);

@connect(selector, mapActionsToProps)
export class Host extends Component {
  constructor(props) {
    super(props);
    this.state = {isFetching: false};
  }

  componentDidMount() {
    const { host_id, host, actions: { loadHosts, loadNetworks, setCurrentGroup } } = this.props;
    if (host_id && !host) {
      this.setState({isFetching: true});
      loadHosts([host_id,])
        .then(() => {
          this.setState({isFetching: false});
          setCurrentGroup(null, host_id);
        })
        .catch((e) => {
          console.log(e);
          this.setState({isFetching: false});
        });
    } else {
      setCurrentGroup(null, host_id);
    }
    loadNetworks();
  }

  componentWillReceiveProps(nextProps) {
    const { host_id, actions: { setCurrentGroup } } = this.props;
    if (host_id != nextProps.host_id) {
      setCurrentGroup(null, nextProps.host_id);
    }
  }

  render() {
    const { host, host_id, networksAllList } = this.props;
    const { isFetching } = this.state;

    return (
      <View {...this.props} layout='vertical'>
        <View height={25} layout='horizontal'>
          <GroupBreadcrumbs showRoot group_id={host && host.group_id}>
            { host && <HostLabel item={host} /> }
          </GroupBreadcrumbs>
        </View>
        <View height={25}>
          <div className={styles.toolbar}>
            Actions:
            <Link to={urls.cmdb.host.show(host_id)}>Show</Link>
            <Link to={urls.cmdb.host.edit(host_id)}>Edit</Link>
            <Link to={urls.cmdb.host.move(host_id)}>Move</Link>
            <Link to={urls.cmdb.host.delete(host_id)}>Delete</Link>
            <Link to={urls.cmdb.host.clients(host_id)}>Clients</Link>
          </div>
        </View>
        <View>
          { host && this.props.children }
        </View>
        <View layout='horizontal'>
          <View>
            { host && <HostIPList host={host} /> }
          </View>
          <View>
            { host && <HostMacList host={host} /> }
          </View>
        </View>
      </View>
    );
  }
}

const Index = (props) => <View {...props}><div>Index page</div></View>;

@connect(selector, mapActionsToProps)
class HostDelete extends Component {
  handleDelete() {
    const { host, actions: { deleteItem, loadGroupChildren }, navigate } = this.props;
    deleteItem(host)
      .then(() => {
        loadGroupChildren(host.group_id);
        navigate(urls.cmdb.group.show(host.group_id));
      })
      .catch(e => console.log(e))
  }
  render() {
    return <View><div>Точно удалить? <Button onClick={this.handleDelete.bind(this)}>Delete</Button></div></View>;
  }
}

import { HostEdit } from './edit';
import { GroupMove } from 'app/cmdb/group/move';
import { HostClients } from './clients';
export const route = (path) => {
  return (
    <Route path={path} component={Host}>
      <IndexRoute component={Index} />
      <Route path='edit' component={HostEdit} />
      <Route path='delete' component={HostDelete} />
      <Route path='move' component={GroupMove} />
      <Route path='clients' component={HostClients} />
    </Route>
  );
};
