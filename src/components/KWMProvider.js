import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { setupKWM } from '../actions/kwm';

class KWMProvider extends React.PureComponent {
  state = {
    id: null,
    authorizationType: null,
    authorizationValue: null,
  }

  static getDerivedStateFromProps(props, state) {
    let { id,  authorizationType, authorizationValue } = state;
    let { user } = props;

    if (user && user.profile && user.access_token) {
      id = user.profile.sub;
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
    let { id,  authorizationType, authorizationValue } = this.state;

    // Trigger kwm connection.
    this.kwm(id, {authorizationType, authorizationValue});
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
    this.kwm(id, {authorizationType, authorizationValue});
  }

  render() {
    return null;
  }

  kwm = async (id, options) => {
    const { dispatch } = this.props;
    // Set credentials and and ask to automatically connect.
    await dispatch(setupKWM(id, {autoConnect: true, ...options}));
  }
}

KWMProvider.propTypes = {
  user: PropTypes.object,
};

const mapStateToProps = state => {
  const { user } = state.common;

  return {
    user,
  };
};

export default connect(mapStateToProps)(KWMProvider);
