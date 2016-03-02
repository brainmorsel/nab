import React, { Component } from 'react';
import { Link, IndexLink } from 'react-router';
import { Route, IndexRoute } from 'react-router';

import urls from 'app/urls';
import { View } from 'ui/layout';
import styles from 'app/index.css';

export class Events extends Component {
  render() {
    return (
      <View {...this.props} layout='vertical'>
        <View height={35}>
          <div className={styles.navigation}>
            <IndexLink activeClassName={styles.active} to={urls.events.index()}>Dashboard</IndexLink>
            <Link activeClassName={styles.active} to={urls.events.problems()}>Problem Hosts</Link>
          </div>
        </View>
        <View>
          { this.props.children }
        </View>
      </View>
    );
  }
}

const Index = (props) => <View {...props}><div>Dashboard under construction.</div></View>;

import { route as problemsRoute } from './problems';
export const route = (path) => {
  return (
    <Route path={path} component={Events}>
      <IndexRoute component={Index} />
      { problemsRoute('problems') }
    </Route>
  );
};
