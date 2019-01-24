import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';

import BaseContainer from 'kpop/es/BaseContainer';
import { fetchConfigAndInitializeUser } from 'kpop/es/config/actions';
import { setError, userRequiredError } from 'kpop/es/common/actions';
import { initialize as initializeOffline } from 'kpop/es/offline/actions';
import { initialize as initializeVisibility } from 'kpop/es/visibility/actions';
import { parseQuery } from 'kpop/es/utils';

import { HowlingProvider } from '../components/howling';
import soundSprite1Ogg from '../sounds/sprite1.ogg';
import soundSprite1Mp3 from '../sounds/sprite1.mp3';
import soundSprite1Json from '../sounds/sprite1.json';

import { basePath, getCurrentAppPath } from '../base';
import Meetscreen  from '../components/Meetscreen';
import KWMProvider from '../components/KWMProvider';
import Snacks from '../components/Snacks';
import { shiftSnacks } from '../actions/snacks';
import { guestLogon } from '../api/kwm';
import { scopeKwm, scopeGuestOK, scopeGrapi, scopeKvs } from '../api/constants';

const routes = [
  {
    path: '/r/:view(call|conference|group)?',
    exact: false,
    component: Meetscreen,
  },
];

class App extends PureComponent {
  state = {
    initialized: false,
  }

  componentDidMount() {
    const { dispatch } = this.props;

    dispatch(initializeVisibility());
    dispatch(initializeOffline());
  }

  componentDidUpdate(prevProps) {
    const { initialized } = this.state;
    const { offline, dispatch, user } = this.props;

    if (!initialized && offline !== prevProps.offline && !offline) {
      this.initialize().then(() => {
        console.info('app initialized'); // eslint-disable-line no-console
        this.setState({
          initialized: true,
        });
      }).catch(err => {
        console.error('app initialization failed - this is fatal', err); // eslint-disable-line no-console
        if (!err.handled) {
          dispatch(setError({
            detail: `${err}`,
            message: 'App start failed with error',
            fatal: true,
          }));
        }
      }) ;
    }

    if (!user && prevProps.user) {
      // Lost the user.
      this.uninitialize();
    }
  }

  initialize = () => {
    const { dispatch } = this.props;

    return dispatch(fetchConfigAndInitializeUser({
      id: 'meet',
      defaults: async config => {
        const scope = config.oidc.scope ? config.oidc.scope.split(' ') : ['openid', 'profile', 'email'];
        const eqp = Object.assign({}, {
          claims: JSON.stringify({
            id_token: { // eslint-disable-line camelcase
              name: null, // This ensures that the name claim is in ID token.
            },
          }),
        }, config.oidc.eqp);

        config.kwm = Object.assign({}, {
          url: '', // If empty, current host is used.
        }, config.kwm);

        // Check for guest support.
        const hpr = parseQuery(window.location.hash.substr(1));
        if (hpr.guest === '1') {
          // Verify, that '/public/' is in our path.
          const path = getCurrentAppPath();
          if (path.indexOf('/public/') >= 0) {
            // Guest mode enabled via scope.
            scope.push(scopeKwm, scopeGuestOK);
            const response = await dispatch(guestLogon(config, path, hpr.token));
            if (response.ok) {
              // Add extra query parameters from response, to oidc.
              Object.assign(eqp, response.eqp);
            }
          }
        } else {
          // Add all scopes which we support for non guest.
          scope.push(scopeKwm, scopeGrapi, scopeKvs);
        }

        config.oidc = Object.assign({}, config.oidc, {
          scope: scope.join(' '),
          eqp: eqp,
        });

        return config;
      },
      // NOTE(longsleep): Only require basic and kopano/kwm scope here, making
      // other scopes optional. All components which depend on specific access
      // should check if the current user actually has gotten it.
      requiredScopes: ['openid', 'profile', 'email', scopeKwm],
    }));
  }

  uninitialize = () => {
    const { dispatch, user} = this.props;

    if (!user) {
      return dispatch(userRequiredError());
    }
  }

  handleShiftSnacks = () => {
    const { dispatch } = this.props;

    return dispatch(shiftSnacks());
  }

  render() {
    const { initialized } = this.state;
    const { config, user, error, snacks, ...other } = this.props;
    const ready = config && user && initialized ? true : false;

    const soundSrc = [ soundSprite1Ogg, soundSprite1Mp3 ];
    const soundSprite = soundSprite1Json;

    return (
      <BaseContainer ready={ready} error={error} config={config} {...other}>
        <KWMProvider/>
        <HowlingProvider src={soundSrc} sprite={soundSprite}>
          <Router basename={basePath}>
            <Switch>
              {routes.map((route, i) => <Route key={i} {...route} />)}
              <Redirect to="/r" />
            </Switch>
          </Router>
        </HowlingProvider>
        <Snacks snacks={snacks} shiftSnacks={this.handleShiftSnacks}/>
      </BaseContainer>
    );
  }
}

App.propTypes = {
  offline: PropTypes.bool.isRequired,
  updateAvailable: PropTypes.bool.isRequired,
  a2HsAvailable: PropTypes.bool.isRequired,
  config: PropTypes.object,
  user: PropTypes.object,
  error: PropTypes.object,
  snacks: PropTypes.array.isRequired,

  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => {
  const { offline, updateAvailable, config, user, error } = state.common;
  const { available: a2HsAvailable } = state.pwa.a2hs;
  const { snacks } = state.snacks;

  return {
    offline,
    updateAvailable,
    a2HsAvailable,
    config,
    user,
    error,
    snacks,
  };
};

export default connect(mapStateToProps)(App);
