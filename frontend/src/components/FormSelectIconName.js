import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';
import Icon from './Icon.js';

const iconNames = [
  'folder',
  'road',
];

export default class FormSelectIconName extends Component {
  render() {
    return (
      <div>
        <select size='1' {...this.props}>
          {iconNames.map(item => <option key={item} value={item}>
                {item}
            </option>)}
        </select>
        <Icon name={this.props.value} />
      </div>
    );
  }
}
