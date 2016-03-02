import React, { Component } from 'react';
import { Link } from 'react-router';
import { Route, IndexRoute } from 'react-router';

import urls from 'app/urls';
import { View } from 'ui/layout';
import { Navigation } from './navigation';
import styles from 'app/index.css';

export class CMDB extends Component {
  render() {
    return (
      <View {...this.props} layout='vertical'>
        <View height={5}>
          <div className={styles.navigation}></div>
        </View>
        <View layout='horizontal'>
          <View ratio={0.4} className={styles.sidebar}>
            <Navigation />
          </View>
          <View>
            { this.props.children }
          </View>
        </View>
      </View>
    );
  }
}

const Index = (props) => <View {...props}><div>Index page</div></View>;

import { route as groupRoute } from './group';
import { route as hostRoute } from './host';
export const route = (path) => {
  return (
    <Route path={path} component={CMDB}>
      <IndexRoute component={Index} />
      { groupRoute('group') }
      { groupRoute('group/:group_id') }
      { hostRoute('host/:host_id') }
    </Route>
  );
};
