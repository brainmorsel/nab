import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { pushPath } from 'redux-simple-router';
import { Route, IndexRoute } from 'react-router';
import { createSelector } from 'reselect';

import * as selectors from './selectors';
import * as actions from 'app/cmdb/actions';

import styles from 'app/index.css';
import urls from 'app/urls';
import { View } from 'ui/layout';
import { GroupLabel } from './label';
import { GroupBreadcrumbs } from './breadcrumbs';
import { Button } from 'ui/form';


function mapActionsToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
    navigate: bindActionCreators(pushPath, dispatch),
  };
}

const selector = createSelector(
  selectors.groupIdFromParams,
  selectors.currentGroup,
  (group_id, group) => {
    return {
      group_id,
      group,
    }
  }
);

@connect(selector, mapActionsToProps)
export class Group extends Component {
  constructor(props) {
    super(props);
    this.state = {isFetching: false};
  }

  componentDidMount() {
    const { group_id, group, actions: { loadGroups, setCurrentGroup } } = this.props;
    if (group_id && !group) {
      this.setState({isFetching: true});
      loadGroups([group_id,])
        .then(() => {
          this.setState({isFetching: false});
          setCurrentGroup(group_id);
        })
        .catch((e) => {
          console.log(e);
          this.setState({isFetching: false});
        });
    } else {
      setCurrentGroup(group_id);
    }
  }

  componentWillReceiveProps(nextProps) {
    const { group_id, actions: { setCurrentGroup } } = this.props;
    if (group_id != nextProps.group_id) {
      setCurrentGroup(nextProps.group_id);
    }
  }

  render() {
    const { group, group_id } = this.props;

    return (
      <View {...this.props} layout='vertical'>
        <View height={25} layout='horizontal'>
          <GroupBreadcrumbs showRoot group_id={group && group.parent_id}>
            { group && <GroupLabel item={group} /> }
          </GroupBreadcrumbs>
        </View>
        <View height={25}>
          { group_id
            ? <div className={styles.toolbar}>
                Actions:
                <Link to={urls.cmdb.group.show(group_id)}>Show</Link>
                <Link to={urls.cmdb.group.edit(group_id)}>Edit</Link>
                <Link to={urls.cmdb.group.move(group_id)}>Move</Link>
                <Link to={urls.cmdb.group.delete(group_id)}>Delete</Link>
                <Link to={urls.cmdb.group.create(group_id)}>Create group</Link>
                <Link to={urls.cmdb.host.create(group_id)}>Create host</Link>
              </div>
            : <div className={styles.toolbar}>
                Actions:
                <Link to={urls.cmdb.group.create()}>Create group</Link>
              </div>
          }
        </View>
        <View>
          { this.props.children }
        </View>
      </View>
    );
  }
}

const Index = (props) => <View {...props}><div>Index page</div></View>;

@connect(selector, mapActionsToProps)
class GroupDelete extends Component {
  handleDelete() {
    const { group, actions: { deleteItem, loadGroupChildren }, navigate } = this.props;
    deleteItem(group)
      .then(() => {
        loadGroupChildren(group.parent_id);
        navigate(urls.cmdb.group.show(group.parent_id));
      })
      .catch(e => console.log(e))
  }
  render() {
    return <View><div>Точно удалить? <Button onClick={this.handleDelete.bind(this)}>Delete</Button></div></View>;
  }
}

import { GroupEdit } from './edit';
import { GroupMove } from './move';
import { HostEdit } from 'app/cmdb/host/edit';

export const route = (path) => {
  return (
    <Route path={path} component={Group}>
      <IndexRoute component={Index} />
      <Route path='edit' component={GroupEdit} />
      <Route path='new' component={GroupEdit} createMode />
      <Route path='new-group' component={GroupEdit} createMode />
      <Route path='new-host' component={HostEdit} createMode />
      <Route path='move' component={GroupMove} />
      <Route path='delete' component={GroupDelete} />
    </Route>
  );
};
