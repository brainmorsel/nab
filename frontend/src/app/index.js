import React, { Component } from 'react';
import { Link, IndexLink } from 'react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { pushPath } from 'redux-simple-router';
import { Route, IndexRoute } from 'react-router';

import { Root, View } from 'ui/layout.js';
import urls from 'app/urls';
import * as actions from './actions';
import selector from './selectors';
import styles from './index.css';

function mapActionsToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

@connect(selector, mapActionsToProps)
export class App extends Component {
  handleClickClearErrors() {
    this.props.actions.errorsClear();
  }

  render() {
    const { dispatch, errorMessages } = this.props;

    return (
      <Root>
        <View layout='vertical'>
          <View layout='horizontal' height={40}>
            <div className={styles.header}>
              <IndexLink activeClassName={styles.active} to={urls.index()}>Home</IndexLink>
              <Link activeClassName={styles.active} to={urls.cmdb.index()}>CMDB</Link>
              <Link activeClassName={styles.active} to={urls.events.index()}>Events</Link>
            </div>
          </View>
          <View ratio={0.25} show={ errorMessages.length > 0 } style={{overflowY: 'auto'}}>
            <div>
              <b>
                Errors
                (<button onClick={this.handleClickClearErrors.bind(this)}>clear</button>):
              </b>
              <ul>
                { errorMessages.map((msg, idx) => <li key={idx}>{ ''+msg }</li>) }
              </ul>
            </div>
          </View>
          { this.props.children }
        </View>
      </Root>
    );
  }
}

const AppIndex = (props) => <View {...props}><div>Index page</div></View>;


import { route as cmdbRoute } from './cmdb';
import { route as eventsRoute } from './events';
export const route = () => {
  return (
    <Route path={urls.prefix} component={App}>
      <IndexRoute component={AppIndex} />
      { cmdbRoute('cmdb') }
      { eventsRoute('events') }
    </Route>
  );
};
