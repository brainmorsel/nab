import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';
import _ from 'lodash';

const RATIO_UNSETTED = -1;

export class Root extends Component {
  constructor(props) {
    super(props);
    this.state = {
      clientWidth: 0,
      clientHeight: 0,
    };
  }

  resize = _.throttle(() => {
    if (this.refs.el) {
      this.setState({
        clientWidth: this.refs.el.clientWidth,
        clientHeight: this.refs.el.clientHeight,
      });
    }
  }, 30)

  componentDidMount() {
    this.resize();
    window.addEventListener('resize', this.resize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize);
  }

  render() {
    const { ...other } = this.props;
    const { clientWidth, clientHeight } = this.state;
    const clientRect = {
      left: 0,
      top: 0,
      width: clientWidth,
      height: clientHeight,
    };

    const style = {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      overflow: 'hidden',
    };

    return (
      <div
        ref='el'
        style={ style }
        { ...other }
        >
        { React.Children.map(this.props.children, (element, idx) => {
            return React.cloneElement(element, { clientRect });
        })}
      </div>
    );
  }
}

const ViewBase = {
  propTypes: {
    width: PropTypes.number,
    height: PropTypes.number,
    ratio: PropTypes.number,
    show: PropTypes.bool,
  },

  defaultProps: {
    width: 0,
    height: 0,
    ratio: RATIO_UNSETTED,
    show: true,
  },

  getOwnRect() {
    const { height, width } = this.props;

    if (this.props.clientRect) {
      return this.props.clientRect;
    }

    const r = {};
    if (height) {
      r.height = height;
    } else {
      r.height = this.refs.el ? this.refs.el.offsetHeight : 0;
    }
    if (width) {
      r.width = width;
    } else {
      r.width = this.refs.el ? this.refs.el.offsetWidth : 0;
    }
    return r;
  },

  getOwnPositionStyle() {
    const { clientRect } = this.props;

    let positioning;
    if (clientRect) {
      positioning = {
        ...clientRect,
        position: 'absolute',
      };
    } else {
      const ownRect = this.getOwnRect();
      positioning = {
        height: ownRect.height || undefined,
        width: ownRect.width || undefined,
      };
    }
    if (!this.props.show) {
      positioning.display = 'none';
    }
    return positioning;
  }
}

export class View extends Component {
  static propTypes = {
    ...ViewBase.propTypes,
    layout: PropTypes.oneOf(['box', 'horizontal', 'vertical']),
    paddingLeft: PropTypes.number,
    paddingRight: PropTypes.number,
    paddingTop: PropTypes.number,
    paddingBottom: PropTypes.number,
    borderWidth: PropTypes.number,
  }

  static defaultProps = {
    ...ViewBase.defaultProps,
    layout: 'box',
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    borderWidth: 0,
  }

  getOwnRect = ViewBase.getOwnRect;
  getOwnPositionStyle = ViewBase.getOwnPositionStyle;

  getOwnClientRect() {
    const { paddingLeft, paddingRight, paddingTop, paddingBottom, borderWidth} = this.props;
    const bLeft = borderWidth;
    const bRight = borderWidth;
    const bTop = borderWidth;
    const bBottom = borderWidth;
    const { width, height } = this.getOwnRect();

    return {
      top: paddingTop,
      left: paddingLeft,
      width: width - (bLeft + bRight + paddingLeft + paddingRight),
      height: height - (bTop + bBottom + paddingTop + paddingBottom),
    };
  }

  layoutChildrenBox() {
    const ownRect = this.getOwnClientRect();
    return React.Children.map(this.props.children, (element, idx) => {
      return ownRect;
    });
  }

  collectChildrenParams() {
    let heightSum = 0;
    let widthSum = 0;
    let ratioSum = 0;
    const params = React.Children.map(this.props.children, (element, idx) => {
      if (!element) {
        return { show: false };
      }
      let { width, height, ratio, show } = element.props;

      // workaround for not View wrapper components
      if (width === undefined) {
        width = 0;
      }
      if (height === undefined) {
        height = 0;
      }
      if (ratio === undefined) {
        ratio = RATIO_UNSETTED;
      }
      if (show === undefined) {
        show = true;
      }

      if (ratio == RATIO_UNSETTED) {
        if (width == 0 && height == 0) {
          ratio = 1;
        } else {
          ratio = 0;
        }
      }
      if (show) {
        heightSum += height;
        widthSum += width;
        ratioSum += ratio;
      }
      return { width, height, ratio, show }
    });

    return { sum: { height: heightSum, width: widthSum, ratio: ratioSum }, params };
  }

  layoutChildrenHorizontal() {
    const ownRect = this.getOwnClientRect();
    const cp = this.collectChildrenParams();

    let left = ownRect.left;
    return cp.params.map((p) => {
      if (!p.show) { return {height:0, width:0} }
      const height = ownRect.height;
      const top = ownRect.top;
      const width = p.width + Math.max(0, ownRect.width - cp.sum.width) * (p.ratio / (cp.sum.ratio || 1));
      const rect = { top, left, width, height };
      left += width;
      return rect;
    });
  }

  layoutChildrenVertical() {
    const ownRect = this.getOwnClientRect();
    const cp = this.collectChildrenParams();

    let top = ownRect.top;
    return cp.params.map((p) => {
      if (!p.show) { return {height:0, width:0} }
      const width = ownRect.width;
      const left = ownRect.left;
      const height = p.height + Math.max(0, ownRect.height - cp.sum.height) * (p.ratio / (cp.sum.ratio || 1));
      const rect = { top, left, width, height };
      top += height;
      return rect;
    });
  }


  layoutChildren() {
    switch (this.props.layout) {
      case 'box':
        return this.layoutChildrenBox();
      case 'horizontal':
        return this.layoutChildrenHorizontal();
      case 'vertical':
        return this.layoutChildrenVertical();
    }
  }

  render() {
    const { clientRect, style, borderWidth, height, width, show, ...other } = this.props;
    const childrenRects = this.layoutChildren();
    const positioning = this.getOwnPositionStyle();

    return (
      <div ref='el'
        style={ {...positioning, borderWidth, ...style} }
        { ...other }
        >
        { React.Children.map(this.props.children, (element, idx) => {
            if (React.isValidElement(element)) {
              return React.cloneElement(element, { clientRect: childrenRects[idx] });
            }
        })}
      </div>
    );
  }
}


export class ScrollView extends Component {
  static propTypes = {
    ...ViewBase.propTypes,
    minimalRowHeight: PropTypes.number,
  }

  static defaultProps = {
    ...ViewBase.defaultProps,
    minimalRowHeight: 20,
  }

  constructor(props) {
    super(props);
    this.state = {
      scrollPosition: 0,
    };

    this._lastScrollPosition = 0;
    this._firstVisible = 0;
    this._visibleChildren = [];
  }

  getOwnRect = ViewBase.getOwnRect;
  getOwnPositionStyle = ViewBase.getOwnPositionStyle;


  scroll = _.throttle(() => {
    if (this.refs.el) {
      this.setState({scrollPosition: this.refs.el.scrollTop});
    }
  }, 30)

  calcChildren() {
    const { minimalRowHeight, clientRect, children } = this.props;

    const clientHeight = clientRect.height;
    const scrollTop = this.state.scrollPosition;
    const scrollDelta = scrollTop - this._lastScrollPosition;
    const totalN = React.Children.count(children);
    const rowHeight = minimalRowHeight;
    const showN = Math.ceil(clientHeight / rowHeight) + 1;

    let skipN = Math.floor(scrollTop / rowHeight);
    if (skipN + showN > totalN) {
      skipN = totalN - showN;
    }

    if (this.refs[0]) {
      let visHeight = 0;
      let visCount = this._visibleChildren.length;

      for (let idx = 0; idx < visCount; idx++) {
        visHeight += this.refs[idx].offsetHeight;
      }

      if (this._firstVisible * rowHeight <= scrollTop && scrollTop <= this._firstVisible * rowHeight + visHeight) {
        let scrolledVisibleHeight = Math.abs(scrollDelta);
        let scrolledN = 0;
        for (let idx = 0; idx < visCount; idx++) {
          if (scrolledVisibleHeight >= this.refs[idx].offsetHeight) {
            scrolledVisibleHeight -= this.refs[idx].offsetHeight;
            scrolledN += 1;
          } else {
            break;
          }
        }
        if (scrollDelta > 0) {
          skipN = this._firstVisible + scrolledN;
        } else {
          skipN = this._firstVisible - scrolledN;
        }
      }

    }
    skipN = Math.max(skipN, 0);

    let skipHeight = skipN * rowHeight;
    let remainHeight = rowHeight * Math.max(0, (totalN - (skipN + showN)));

    let childrenArray;
    if (_.isArray(children)) {
      childrenArray = children;
    } else {
      childrenArray = React.Children.toArray(children);
    }
    let visibleChildren = [];
    for (let i = skipN, to = Math.min(skipN + showN, totalN); i < to; i++) {
      visibleChildren.push(React.cloneElement(childrenArray[i], { ref: i }));
    }

    this._firstVisible = skipN;
    this._visibleChildren = visibleChildren;
    this._lastScrollPosition = scrollTop;

    return { visibleChildren, skipHeight, remainHeight};
  }

  handleScroll(e) {
    this.scroll();
  }

  getScrollBarWidth() {
    if (!this.refs.el) {
      return;
    }
    const cs = getComputedStyle(this.refs.el);
    const borderLeft = parseInt(cs.getPropertyValue('border-left-width'), 10);
    const borderRight = parseInt(cs.getPropertyValue('border-right-width'), 10);

    return this.refs.el.offsetWidth - (this.refs.el.clientWidth + borderLeft + borderRight);
  }

  getClientWidth() {
    return this.refs.el.clientWidth;
  }

  render() {
    const { children, clientRect, style, borderWidth, height, width, show, ...other } = this.props;
    const { visibleChildren, skipHeight, remainHeight } = this.calcChildren();
    const positioning = this.getOwnPositionStyle();

    return (
      <div
        ref='el'
        onScroll={ this.handleScroll.bind(this) }
        style={ {
          ...positioning,
          borderWidth,
          overflowY: 'scroll',
          ...style,
        } }
        { ...other }
        >
        <div style={{minHeight: skipHeight}} />
        { visibleChildren }
        <div style={{minHeight: remainHeight}} />
      </div>
    );
  }
}
