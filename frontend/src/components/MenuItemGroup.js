import React, { Component, PropTypes } from 'react';
import MenuItem from './MenuItem';
import Icon from './Icon.js';
import GroupLabel from './GroupLabel.js';
import HostLabel from './HostLabel.js';


export default class MenuItemGroup extends Component {
  constructor(props) {
    super(props);
    this.state = {isOpen: false, isFetching: false};
  }

  componentDidMount() {
  }

  handleToggle() {
    if (!this.state.isOpen) {
      this.handleReload();
    }
    this.setState({isOpen: !this.state.isOpen});
  }

  handleReload() {
    const { loadGroupItems, group_id } = this.props;

    if (!this.state.isFetching) {
      this.setState({isFetching: true});
      loadGroupItems(group_id).then(() => {
        this.setState({isFetching: false});
      });
    }
  }

  handleClick() {
    const { onClick, group_id } = this.props;

    if (!this.state.isOpen) {
      this.handleToggle();
    }
  }

  render() {
    const { getItemData, name, items, group_id } = this.props;
    const { isOpen, isFetching } = this.state;
    const curItem = getItemData({type: 'group', group_id}) || {name, icon_name: this.props.iconName};

    const hoverButtons = [
      <Icon key='reload' fixedWidth name='refresh' onClick={this.handleReload.bind(this)} className='reload' title='Обновить'/>
    ];

    return (
      <MenuItem
        label={<GroupLabel isLink group={curItem}/>}
        title={curItem.group_type_name}
        canHasChildren
        isOpen={isOpen}
        isFetching={isFetching}
        onToggle={this.handleToggle.bind(this)}
        onClick={this.handleClick.bind(this)}
        hoverButtons={hoverButtons}
        >
            { items && items.length > 0
                ? items.map(item => (()=>{
                  switch (item.type) {
                    case 'group': {
                      let {group_id, name, children} = getItemData(item);
                      return <MenuItemGroup {...this.props} key={`group${group_id}`} group_id={group_id} name={name} items={children}/>
                    }
                    case 'host': {
                      let host = getItemData(item);
                      return (
                        <MenuItem
                          label={<HostLabel isLink host={host}/>}
                          key={`host${host.host_id}`}
                          />
                      );
                    }
                  }
                })())
                : <li>{isFetching ? 'Загрузка...' : 'Пока ничего нет.'}</li>
            }
      </MenuItem>
    );
  }
}
