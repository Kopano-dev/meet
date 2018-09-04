import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { setupKWM } from '../actions/kwm';
import { getOwnGrapiUserEntryID } from '../selectors';

class KWMProvider extends React.PureComponent {
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
