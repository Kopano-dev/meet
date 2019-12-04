import React from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { injectIntl, intlShape/*, FormattedMessage, defineMessages*/ } from 'react-intl';

import { withSnackbar } from 'kpop/es/BaseContainer';

import {
  removeSnackbar,
  closeSnackbar,
} from '../actions/meet';

class Notifier extends React.PureComponent {
  displayed = [];

  storeDisplayed = key => {
    this.displayed = [ ...this.displayed, key ];
  }

  removeDisplayed = key => {
    this.displayed = this.displayed.filter(k => key !== k);
  }

  componentDidUpdate() {
    const {
      intl,
      notifications = [],
      closeSnackbar,
      enqueueSnackbar,
      removeSnackbar,
    } = this.props;

    notifications.forEach(({ key, message, options = {}, dismissed = false }) => {
      // Fastpass to dismiss.
      if (dismissed) {
        closeSnackbar(key);
        return;
      }

      // Avoid to display again.
      if (this.displayed.includes(key)) {
        return;
      }

      // Translation support.
      if (typeof message !== 'string') {
        message = intl.formatMessage(message);
      }

      // Display.
      enqueueSnackbar(message, {
        key,
        ...options,
        onClose: (event, reason, key) => {
          if (options.onClose) {
            options.onClose(event, reason, key);
          }
        },
        onExited: (event, key) => {
          removeSnackbar(key);
          this.removeDisplayed(key);
        },
      });

      // Keep track.
      this.storeDisplayed(key);
    });
  }

  render() {
    return null;
  }
}

Notifier.defaultProps = {
  messages: {},
};

Notifier.propTypes = {
  intl: intlShape.isRequired,

  notifications: PropTypes.array.isRequired,

  closeSnackbar: PropTypes.func.isRequired,
  removeSnackbar: PropTypes.func.isRequired,

  enqueueSnackbar: PropTypes.func.isRequired,
};

const mapStateToProps = state => {
  const { notifications } = state.meet;

  return {
    notifications,
  };
};

const mapDispatchToProps = dispatch => bindActionCreators({
  closeSnackbar,
  removeSnackbar,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(withSnackbar(injectIntl(Notifier)));
