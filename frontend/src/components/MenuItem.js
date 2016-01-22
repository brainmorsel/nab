import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';

import './MenuItem.css';
import Icon from './Icon.js';


export default class MenuItem extends Component {
  render() {
    const { label, title, canHasChildren, isOpen, isFetching, iconName, hoverButtons, isSelected } = this.props;
    const { onToggle, onClick } = this.props;

    const toggleIcon = isFetching ? 'spinner' : (isOpen ? 'caret-down' : 'caret-right');

    return (
      <li className={classNames('treemenu-item', {'selected': isSelected})}>
        <div className='treemenu-item-label'>
          { canHasChildren ? (
              <div className='treemenu-item-toggle' onClick={onToggle}>
                <Icon name={toggleIcon} spin={isFetching} fixedWidth />
              </div>
              ) : '' }

          { hoverButtons ? <div className='treemenu-item-btns'>{hoverButtons}</div> : '' }

          <span className='label' title={title} onClick={onClick}>
            {iconName ? <Icon name={iconName} fixedWidth /> : ''}
            {label}
          </span>
        </div>

        <div style={{display: isOpen ? '' : 'none'}}>
          <ul>
            { this.props.children }
          </ul>
        </div>
      </li>
    );
  }
}
