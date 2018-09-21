import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import debounce from 'kpop/es/utils/debounce';

import { setupKWM, destroyKWM } from '../actions/kwm';
import { getOwnGrapiUserEntryID } from '../selectors';

class KWMProvider extends React.PureComponent {
  reconnector: null;
  destroyed: false;
  kwm: null;

  state = {
    id: null,
    authorizationType: null,
    authorizationValue: null,
  }

  static getDerivedStateFromProps(props, state) {
    let { id, authorizationType, authorizationValue } = state;
    let { user, grapiID } = props;

    if (user && user.profile && user.access_token) {
      // NOTE(longsleep): Get Kopano Groupware API user first, otherwise use
      // the sub from OIDC>
      id = grapiID ? grapiID : user.profile.sub;
      authorizationType = user.token_type;
      authorizationValue = user.access_token;
    } else {
      id = null;
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
      authorizationType,
      authorizationValue,
    };
  }

  componentDidMount() {
    this.connect();
  }

  componentDidUpdate(prevProps, prevState) {
    let { id, authorizationType, authorizationValue } = this.state;

    if (id === prevState.id
      && authorizationType === prevState.authorizationType
      && authorizationValue === prevState.authorizationValue) {
      // Nothing changed.
      return;
    }

    // Trigger kwm connection.
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
    let { id,  authorizationType, authorizationValue } = this.state;

    if (this.reconnector) {
      this.reconnector.cancel();
      this.reconnector = null;
    }

    // Trigger kwm connection.
    const kwm = await dispatch(setupKWM(id, {authorizationType, authorizationValue, autoConnect: true})).then(kwm => {
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

  user: PropTypes.object,
  grapiID: PropTypes.string,
};

const mapStateToProps = state => {
  const { user } = state.common;
  const grapiID = getOwnGrapiUserEntryID(state);

  return {
    user,
    grapiID,
  };
};

export default connect(mapStateToProps)(KWMProvider);
