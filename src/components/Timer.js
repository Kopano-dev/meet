import React from 'react';
import PropTypes from 'prop-types';

import moment from '../moment';

class Timer extends React.PureComponent {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.timestamp = undefined;
    this.stopped = false;
  }

  updateTime = (timestamp) => {
    if (this.stopped) {
      return;
    }

    if (this.timestamp === undefined) {
      this.timestamp = timestamp;
    }

    const elapsed = timestamp - this.timestamp;
    if (elapsed >= 500) {
      this.ref.current.innerHTML = this.formatTimeString();
    }

    window.requestAnimationFrame(this.updateTime);
  }

  formatTimeString = () => {
    const { start } = this.props;

    const now = moment();
    const duration = moment.duration(now.diff(start));
    const hours = parseInt(duration.as('hours'), 10);

    const result = [];
    if (hours > 0) {
      result.push(String(hours));
    }
    return [
      ...result,
      ('0' + duration.minutes()).slice(-2),
      ('0' + duration.seconds()).slice(-2),
    ].join(':');
  }

  componentDidMount() {
    this.updateTime();
  }

  render() {
    return <span ref={this.ref}>{this.formatTimeString()}</span>;
  }

  componentWillUnmount() {
    this.stopped = true;
  }
}

Timer.propTypes = {
  start: PropTypes.object.isRequired,
};

export default Timer;
