import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { toggleStandby } from '../actions/meet';

class AutoStandby extends React.PureComponent {
  componentDidMount() {
    const { hidden, disabled, toggleStandby } = this.props;

    if (!disabled) {
      toggleStandby(!!hidden);
    }
  }

  componentDidUpdate(prevProps) {
    const { mode, hidden, disabled, wakeLock, toggleStandby } = this.props;

    if (hidden !== prevProps.hidden ||
        wakeLock !== prevProps.wakeLock ||
        disabled !== prevProps.disabled
    ) {
      if (!disabled) {
        if (mode !== 'standby') {
          if (hidden && !wakeLock) {
            // Switch to standby.
            console.info('Switching to standby after hide'); // eslint-disable-line no-console
            toggleStandby(true);
          }
        } else {
          if (prevProps.hidden && !hidden) {
            console.info('Switching from standby after no longer hide'); // eslint-disable-line no-console
            toggleStandby(false);
          }
        }
      }
    }
  }

  componentWillUnmount() {
    const { disabled, toggleStandby } = this.props;

    if (!disabled) {
      toggleStandby(true);
    }
  }

  render() {
    return null;
  }
}

AutoStandby.propTypes = {
  mode: PropTypes.string.isRequired,
  hidden: PropTypes.bool.isRequired,

  disabled: PropTypes.bool,
  wakeLock: PropTypes.bool,

  toggleStandby: PropTypes.func.isRequired,
};

const mapStateToProps = state => {
  const { mode } = state.meet;
  const { hidden } = state.common;

  return {
    mode,
    hidden,
  };
};

const mapDispatchToProps = dispatch => bindActionCreators({
  toggleStandby,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(AutoStandby);
