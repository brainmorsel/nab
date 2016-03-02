import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';

import styles from './item.css';
import Icon from 'ui/widgets/icon';


export class TreeItem extends Component {
  render() {
    const { label, title, canHasChildren, isOpen, isFetching, iconName, hoverButtons, isSelected, isCurrent } = this.props;
    const { onToggle, onClick } = this.props;

    const toggleIcon = isFetching ? 'spinner' : (isOpen ? 'caret-down' : 'caret-right');

    return (
      <li className={classNames(styles.item, {[styles.selected]: isSelected, [styles.current]: isCurrent})}>
        <div className={styles.label}>
          { canHasChildren
              ? <div className={styles.toggle} onClick={onToggle}>
                  <Icon name={toggleIcon} spin={isFetching} fixedWidth />
                </div>
              : <Icon name='blank' fixedWidth /> }

          { hoverButtons ? <div className={styles.buttons}>{hoverButtons}</div> : '' }

          <span className={styles.text} title={title} onClick={onClick}>
            {iconName ? <Icon name={iconName} fixedWidth /> : ''}
            {label}
          </span>
        </div>

        <ul style={{display: isOpen ? '' : 'none'}}>
          { this.props.children }
        </ul>
      </li>
    );
  }
}
