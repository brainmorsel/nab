import React, { Component, PropTypes } from 'react';

import { TreeItem } from './item';
import Icon from 'ui/widgets/icon';


export class TreeItemSimpleList extends Component {
  constructor(props) {
    super(props);
    this.state = {isOpen: false, isFetching: false};
  }

  handleToggle() {
    if (!this.state.isOpen) {
      this.handleReload();
    }
    this.setState({isOpen: !this.state.isOpen});
  }

  handleReload() {
    const { loadData } = this.props;

    if (!this.state.isFetching) {
      this.setState({isFetching: true});
      loadData().then(() => {
        this.setState({isFetching: false});
      });
    }
  }

  handleClick() {
    const { onClick } = this.props;

    if (!this.state.isOpen) {
      this.handleToggle();
    }
  }

  render() {
    const { isOpen, isFetching } = this.state;
    const { children, iconName, label, childLabelComponent } = this.props;

    const hoverButtons = [
      <Icon key='reload' fixedWidth name='refresh' onClick={this.handleReload.bind(this)} title='Обновить'/>
    ];

    return (
      <TreeItem
        label={label}
        iconName={iconName}
        canHasChildren
        isOpen={isOpen}
        isFetching={isFetching}
        onToggle={this.handleToggle.bind(this)}
        onClick={this.handleClick.bind(this)}
        hoverButtons={hoverButtons}
        >
          { children && children.length > 0
              ? children.map((item, key) => (()=>{
                return <TreeItem key={key} label={childLabelComponent({item})} />;
              })())
              : <li>{isFetching ? 'Загрузка...' : 'Пока ничего нет.'}</li>
          }
      </TreeItem>
    );
  }
}
