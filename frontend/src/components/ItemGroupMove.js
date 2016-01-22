import React, { Component, PropTypes } from 'react';

import GroupsTreeNavigator from './GroupsTreeNavigator.js';
import FormButton from './FormButton.js';
import GroupLabel from './GroupLabel.js';

export default class ItemGroupMove extends Component {
  constructor(props) {
    super(props);
    this.state = {selected: undefined};
  }

  handleSelect(group) {
    this.setState({selected: group});
  }

  handleMove() {
    const { item } = this.props;
    const { selected } = this.state;

    this.props.actions.moveItem(item, selected)
      .then(() => console.log('OK!'))
      .catch(e => console.log(e));
  }

  render() {
    const { item } = this.props;
    const { selected } = this.state;

    return (
      <div>
        <div>Выберите группу, в которую хотите переместить, из списка внизу и нажмите кнопку "move".</div>
        Target: {selected ? <GroupLabel group={selected}/> : 'not selected'}
        <FormButton onClick={this.handleMove.bind(this)} disabled={!selected}>move</FormButton>
        <GroupsTreeNavigator selected={selected} onSelect={this.handleSelect.bind(this)} />
      </div>
    );
  }
}
