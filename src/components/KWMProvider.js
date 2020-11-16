import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { injectIntl, intlShape, defineMessages } from 'react-intl';

import debounce from 'kpop/es/utils/debounce';
import { enqueueSnackbar } from 'kpop/es/common/actions';

import { setupKWM, destroyKWM } from '../actions/kwm';

const translations = defineMessages({
  rejectedBusySnack: {
    id: 'kwmProvider.rejectedBusy.snack',
    defaultMessage: 'The target is busy.',
  },
  rejectedSnack: {
    id: 'kwmProvider.rejected.snack',
    defaultMessage: ' The target rejected your call.',
  },
});

class KWMProvider extends React.PureComponent {
  reconnector = null;
  destroyed = false;
  kwm = null;

  state = {
    id: null,
    idToken: null,
    authorizationType: null,
    authorizationValue: null,
  }

  static getDerivedStateFromProps(props, state) {
    let { id, idToken, authorizationType, authorizationValue } = state;
    let { user } = props;

    if (user && user.profile && user.access_token) {
      id = user.profile.sub;
      idToken = user.id_token;
      authorizationType = user.token_type;
      authorizationValue = user.access_token;
    } else {
      id = null;
      idToken = null;
      authorizationType = null;
      authorizationValue = null;
    }

    // ID is the base for KWM connections.
    if (id === state.id
      && authorizationType === state.authorizationType
      && authorizationValue === state.authorizationValue) {
      // Nothing changed.
      return null;
    }
    return {
      id,
      idToken,
      authorizationType,
      authorizationValue,
    };
  }

  componentDidMount() {
    const { id } = this.state;

    if (id) {
      this.connect();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { id, authorizationType, authorizationValue } = this.state;

    if (id === prevState.id
      && authorizationType === prevState.authorizationType
      && authorizationValue === prevState.authorizationValue) {
      // Nothing changed.
      return;
    }
    if (!id && !prevState.id) {
      // Nothing todo.
      return;
    }

    // Trigger kwm connection or update existing.
    this.connect();
  }

  componentWillUnmount() {
    this.destroy();
  }

  render() {
    return null;
  }

  connect = async () => {
    const { dispatch } = this.props;
    const { id, idToken, authorizationType, authorizationValue } = this.state;

    if (this.reconnector) {
      this.reconnector.cancel();
      this.reconnector = null;
    }

    // Trigger kwm connection.
    const kwm = await dispatch(setupKWM(id, idToken, {
      authorizationType,
      authorizationValue,
      autoConnect: true,
      eventCallback: this.handleEvent,
    })).then(kwm => {
      if (this.destroyed) {
        // Disconnect.
        kwm.destroy();
        return null;
      }
      if (this.reconnector) {
        this.reconnector.cancel();
        this.reconnector = null;
      }

      return kwm;
    }).catch(err => { // eslint-disable-line no-unused-vars
      if (this.destroyed) {
        return null;
      }
      if (this.reconnector) {
        this.reconnector.cancel();
        this.reconnector = null;
      }
      this.reconnector = debounce(this.connect, 5000)();
      return null;
    });

    this.kwm = kwm;
  }

  handleEvent = event => {
    const { intl, dispatch } = this.props;

    // Extra KWM event handler, bridge to UI.
    switch (event.event) {
      case 'incomingcall':
      case 'destroycall':
        // TODO(longsleep): Start timer for incoming call, auto reject it after a while and show a snack about missed call.
        break;

      case 'abortcall': {
        switch (event.details) {
          case 'reject_busy':
            dispatch(enqueueSnackbar({
              message: intl.formatMessage(translations.rejectedBusySnack),
              options: { variant: 'info' },
            }));
            break;
          case 'reject':
            dispatch(enqueueSnackbar({
              message: intl.formatMessage(translations.rejectedSnack),
              options: { variant: 'info' },
            }));
            break;
          default:
        }

        break;
      }

      default:
    }
  }

  destroy = () => {
    const { dispatch } = this.props;

    this.destroyed = true;
    if (this.reconnector) {
      this.reconnector.cancel();
    }

    return dispatch(destroyKWM());
  }
}

KWMProvider.propTypes = {
  dispatch: PropTypes.func.isRequired,
  intl: intlShape.isRequired,

  user: PropTypes.object,
};

const mapStateToProps = state => {
  const { user } = state.common;

  return {
    user,
  };
};

export default connect(mapStateToProps)(injectIntl(KWMProvider));
