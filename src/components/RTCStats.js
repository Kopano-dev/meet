import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { getStatsForAllConnections } from '../actions/kwm';

class RTCStats extends React.PureComponent {
  interval = 5000;
  timer = null;
  started = false;

  constructor() {
    super();

    this.stats = {};
    this.state = {
      transportsBytesSendPerSecond: 0,
      transportsBytesReceivedPerSecond: 0,
    };
  }

  componentDidMount() {
    this.start();
  }

  componentWillUnmount() {
    this.stop();
  }

  render() {
    const { className } = this.props;
    const {
      ready,
      transportsBytesSendPerSecond,
      transportsBytesReceivedPerSecond,
      transportsBytesSend,
      transportsBytesReceived,
    } = this.state;

    if (!ready) {
      return null;
    }

    const bytesAll = (transportsBytesSend + transportsBytesReceived) / 1024 / 1024;
    return <div className={className}>
      <span>{(transportsBytesReceivedPerSecond/125).toFixed(1)} Mbit/s in</span>
      <br/>
      <span>{(transportsBytesSendPerSecond/125).toFixed(1)} Mbit/s out</span>
      <br/>
      <span>{bytesAll.toFixed(0)} MiB</span>
    </div>;
  }

  start() {
    if (!this.started) {
      this.started = true;
      this.stats = {
        timestamp: new Date().getTime(),
      };
      let ready = false;
      const starter = () => {
        this.getStats().then(stats => {
          if (this.started) {
            const {
              transportsBytesSendPerSecond,
              transportsBytesReceivedPerSecond,
              transportsBytesSend,
              transportsBytesReceived,
            } = stats;

            const update = {
              transportsBytesSendPerSecond,
              transportsBytesReceivedPerSecond,
              transportsBytesSend,
              transportsBytesReceived,
            };
            if (ready && transportsBytesSend && transportsBytesReceived) {
              update.ready = true;
            }
            ready = true;
            this.setState(update, () => {
              if (this.started) {
                this.timer = setTimeout(starter, this.interval);
              }
            });
          }
        });
      };
      starter();
    }
  }

  stop() {
    clearTimeout(this.timer);
    this.started = false;
  }

  getStats = async () => {
    let stats = await this.props.getStatsForAllConnections();
    if (!stats) {
      stats = {};
    }
    if (!stats.timestamp) {
      stats.timestamp = new Date().getTime();
    }

    // Compute rate.
    const transportsBytesSend = (stats.transportsBytesSend || 0) - (this.stats.transportsBytesSend || 0);
    const transportsBytesReceived = (stats.transportsBytesReceived || 0) - (this.stats.transportsBytesReceived || 0);

    const duration = stats.timestamp - this.stats.timestamp;

    stats.transportsBytesSendPerSecond = Math.floor(transportsBytesSend/duration);
    stats.transportsBytesReceivedPerSecond = Math.floor(transportsBytesReceived/duration);
    stats.duration = duration;
    this.stats = stats;

    return stats;
  }
}

RTCStats.propTypes = {
  className: PropTypes.string,

  getStatsForAllConnections: PropTypes.func.isRequired,
};

const mapDispatchToProps = (dispatch) => {
  return {
    getStatsForAllConnections: () => {
      return dispatch(getStatsForAllConnections());
    },
  };
};

export default connect(null, mapDispatchToProps)(RTCStats);
