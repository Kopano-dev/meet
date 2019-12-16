import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { getStatsForAllConnections } from '../../actions/kwm';

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

    const bytesAll = (transportsBytesSend + transportsBytesReceived) / 1024 / 1024;
    if (!ready || !bytesAll) {
      return null;
    }

    /* eslint-disable @calm/react-intl/missing-formatted-message */
    return <div className={className}>
      <span>{(transportsBytesReceivedPerSecond/125).toFixed(1)} Mbps in, </span>
      <span>{(transportsBytesSendPerSecond/125).toFixed(1)} Mbps out, </span>
      <span>{bytesAll.toFixed(0)} MiB</span>
    </div>;
    /* eslint-enable @calm/react-intl/missing-formatted-message */
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

    let duration = stats.timestamp - this.stats.timestamp;
    if (!duration || duration < 0) {
      duration = 0;
    }

    stats.transportsBytesSendPerSecond = duration ? Math.floor(transportsBytesSend/duration) : 0;
    stats.transportsBytesReceivedPerSecond = duration ? Math.floor(transportsBytesReceived/duration) : 0;
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
