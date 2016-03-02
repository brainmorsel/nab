import React, { Component } from 'react';
import classNames from 'classnames';

import styles from './index.css';

export class Tree extends Component {
  render() {
    const { className } = this.props;

    return (
        <ul className={classNames(className, styles.tree)}>
          { this.props.children }
        </ul>
    );
  }
}
