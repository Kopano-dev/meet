import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';

import BaseContainer from 'kpop/es/BaseContainer';
import { fetchConfigAndInitializeUser } from 'kpop/es/config/actions';
import { setError, userRequiredError } from 'kpop/es/common/actions';
import { initialize as initializeOffline } from 'kpop/es/offline/actions';
import { initialize as initializeVisibility } from 'kpop/es/visibility/actions';

import { HowlingProvider } from '../components/howling';
import soundSprite1Ogg from '../sounds/sprite1.ogg';
import soundSprite1Mp3 from '../sounds/sprite1.mp3';
import soundSprite1Json from '../sounds/sprite1.json';

import { basePath } from '../base';
import Meetscreen  from '../components/Meetscreen';
import KWMProvider from '../components/KWMProvider';
import Snacks from '../components/Snacks';


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
      defaults: config => {
        config.oidc = Object.assign({
          scope: 'openid profile email kopano/gc kopano/kwm',
        }, config.oidc);
        config.kwm = Object.assign({
          url: '', // If empty, current host is used.
        }, config.kwm);
        return config;
      },
      // TODO(longsleep): Also require kopano/kwm scope once implemented.
      requiredScopes: ['openid', 'profile', 'email', 'kopano/gc'],
    }));
  }

  uninitialize = () => {
    const { dispatch, user} = this.props;

    if (!user) {
      return dispatch(userRequiredError());
    }
  }

  render() {
    const { initialized } = this.state;
    const { config, user, error, ...other } = this.props;
    const ready = config && user && initialized ? true : false;

    const soundSrc = [ soundSprite1Ogg, soundSprite1Mp3 ];
    const soundSprite = soundSprite1Json;

    const snack = error ? {variant: 'error', ...error} : null;

    return (
      <BaseContainer ready={ready} error={error} {...other}>
        <KWMProvider/>
        <HowlingProvider src={soundSrc} sprite={soundSprite}>
          <Router basename={basePath}>
            <Switch>
              {routes.map((route, i) => <Route key={i} {...route} />)}
              <Redirect to="/r" />
            </Switch>
          </Router>
        </HowlingProvider>
        <Snacks snack={snack} />
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

  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => {
  const { offline, updateAvailable, config, user, error } = state.common;
  const { available: a2HsAvailable } = state.pwa.a2hs;

  return {
    offline,
    updateAvailable,
    a2HsAvailable,
    config,
    user,
    error,
  };
};

export default connect(mapStateToProps)(App);
