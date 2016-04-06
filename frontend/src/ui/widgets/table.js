import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';

import styles from './table.css';
import { View, ScrollView } from '../layout';


export class Table extends Component {
  static defaultProps = {
    showFilters: true,
  }

  constructor(props) {
    super(props);
    this.state = {
      scrollviewWidth: '100%',
    };
  }

  getSharedStyle(c) {
    return {
      flex: c.width ? '' : (c.flex || '1'),
      width: c.width,
      borderRight: '1px solid #555',
    }
  }

  defaultRowRender(props, columns) {
    const { idx, item, data, rowStyleFunc, rowClassFunc, ...other } = props;

    const rowStyle = rowStyleFunc && rowStyleFunc(item);
    const rowClass = rowClassFunc && rowClassFunc(item);

    return (
      <div
        key={item._key || idx}
        className={classNames(
            styles.row,
            idx % 2 ? styles.even : styles.odd,
            rowClass
            )}
        style={rowStyle}
        >
        { columns.map((c, idx) => {
          const style = this.getSharedStyle(c);
          const render = c.render || this.defaultFieldRender;
          return render({key: c.field+idx, style}, item[c.field], item, idx, data);
        })}
      </div>
    );
  }

  defaultFieldRender(props, value, row, idx, data) {
    return <div {...props}>{ value }</div>;
  }

  defaultHeaderRender(columns) {
    return (
      <div className={styles.header}>
        { columns.map((c, idx) => {
          const style = {
            ...this.getSharedStyle(c),
          };
          return (
            <div key={c.field + idx} style={style}>
              {c.label || c.field}
            </div>
          );
        })}
      </div>
    );
  }

  defaultFiltersRender(columns) {
    return (
      <div className={styles.filters}>
        { columns.map((c, idx) => {
          const style = {
            ...this.getSharedStyle(c),
          };
          return (
            <div key={c.field + idx} style={style} className={styles.filter}>
              {c.filter}
            </div>
          );
        })}
      </div>
    );
  }

  render() {
    const { columns, data, rowStyleFunc, rowClassFunc, ...other } = this.props;

    const showFilters = this.props.showFilters && columns.filter(c => c.filter).length > 0;
    const children = data.map((item, idx) => this.defaultRowRender({item, idx, data, rowStyleFunc, rowClassFunc}, columns));

    setTimeout(() => {
      const scrollviewWidth = this.refs.scrollview.getClientWidth();

      if (scrollviewWidth != this.state.scrollviewWidth) {
        this.setState({scrollviewWidth});
      }
    }, 0);

    return (
      <View {...other} layout='vertical'>
        <View height={25} style={{width: this.state.scrollviewWidth}}>
          { this.defaultHeaderRender(columns || []) }
        </View>
        <View height={25} show={showFilters} style={{width: this.state.scrollviewWidth}}>
          { this.defaultFiltersRender(columns || []) }
        </View>
        <ScrollView ref='scrollview'>
          { children }
        </ScrollView>
      </View>
    );
  }
}
