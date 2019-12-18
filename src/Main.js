import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { ConnectedRouter } from 'connected-react-router';
import Moment from 'react-moment';

import BaseContainer from 'kpop/es/BaseContainer';
import MainContainer from 'kpop/es/MainContainer';
import { fetchConfigAndInitializeUser } from 'kpop/es/config/actions';
import { appInitializationError } from 'kpop/es/common/actions';
import {
  scopeOpenID,
  scopeEmail,
  scopeProfile,
  scopeKwm,
  scopeGuestOK,
  scopeGrapi,
  scopeKvs,
} from 'kpop/es/oidc/scopes';

import HowlingProvider from './components/Howling/HowlingProvider';
import soundSprite1Ogg from './sounds/sprite1.ogg';
import soundSprite1Mp3 from './sounds/sprite1.mp3';
import soundSprite1Json from './sounds/sprite1.json';

import KWMProvider from './components/KWMProvider';
import { tryGuestLogon } from './api/kwm';
import Routes from './Routes';

class Main extends PureComponent {
  state = {
    initialized: false,
  }

  componentDidUpdate(prevProps) {
    const { initialized } = this.state;
    const { offline, dispatch } = this.props;

    if (!initialized && offline !== prevProps.offline && !offline) {
      this.initialize().then(() => {
        console.info('app initialized'); // eslint-disable-line no-console
        this.setState({
          initialized: true,
        });
      }).catch(err => {
        console.error('app initialization failed - this is fatal', err); // eslint-disable-line no-console
        if (!err.handled) {
          dispatch(appInitializationError(true, {detail: String(err)}));
        }
      }) ;
    }

    /*if (!user && prevProps.user) {
      // Lost the user.
      this.uninitialize();
    }*/
  }

  initialize = () => {
    const { dispatch, history } = this.props;
    const options = {
      id: 'meet',
      history, // Provide history implementation.
      withUserLazy: true,
      defaults: async config => {
        config = {
          oidc: {},
          disableFullGAB: false,  // When true, does not count contacts on load, and searches on server always.
          useIdentifiedUser: false,  // When true, authenticates with kwm as identified user name instead of user ID.
          ...config,
        };
        const scope = config.oidc.scope ?
          config.oidc.scope : [scopeOpenID, scopeProfile, scopeEmail, scopeKwm, scopeGrapi, scopeKvs].join(' ');
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
        config.oidc = Object.assign({}, config.oidc, {
          scope,
          eqp,
        });

        return config;
      },
      // NOTE(longsleep): Only require basic and kopano/kwm scope here, making
      // other scopes optional. All components which depend on specific access
      // should check if the current user actually has gotten it.
      requiredScopes: [scopeOpenID, scopeProfile, scopeEmail, scopeKwm],
      args: (config, overrides={}) => {
        const guestEnabled = config.guests.default ? true : !!this.props.guest.guest;
        return {
          onBeforeSignin: async (userManager, args) => {
            if (!config.guests || !config.guests.enabled) {
              // Only even try guest logon when enabled in config.
              return;
            }
            // Check if this is a guest request.
            const { guest } = this.props;
            if (!guest.guest) {
              delete userManager.settings.extraQueryParams.request;
              return;
            }
            // Add guest scope to request.
            const scope = userManager.settings.scope + ' ' + scopeGuestOK;
            // Logon guest via kwm API to receive extra guest logon values for OIDC.
            const logon = await dispatch(tryGuestLogon({
              ...guest,
              scope,
              iss: userManager.settings.authority,
              client_id: userManager.settings.client_id,  // eslint-disable-line camelcase
              locale: Moment.globalLocale,
            }));
            if (logon.ok) {
              // Set extra params for OIDC - this contains a signe OIDC request
              // object which overrides OIDC settings.
              userManager.settings.extraQueryParams = Object.assign(userManager.settings.extraQueryParams, logon.eqp); // eslint-disable-line require-atomic-updates
              if (args) {
                // Never prompt when requesting guests.
                args.prompt = 'none';
              }
            }
          },
          onBeforeSignout: async (userManager, args) => {
            if (args.state && args.state.route) {
              // Remove all hash values from the current route on sign out.
              const route = new URL(args.state.route, 'http://localhost');
              route.hash = ''; // Reset hash before signout.
              args.state.route = route.toString().substr(16);
            }
          },
          noRedirect: !!guestEnabled,
          removeUser: !!guestEnabled,
          ...overrides,
        };
      },
    };

    return dispatch(fetchConfigAndInitializeUser(options));
  }

  /*uninitialize = () => {
    const { dispatch, user} = this.props;

    if (!user) {
      return dispatch(userRequiredError());
    }
  }*/

  render() {
    const { initialized } = this.state;
    const { config, user, error, history, ...other } = this.props;
    const ready = config && initialized ? true : false;

    const soundSrc = [ soundSprite1Ogg, soundSprite1Mp3 ];
    const soundSprite = soundSprite1Json;

    const events = ['channelChanged'];

    return (
      <BaseContainer ready={ready} error={error} config={config} events={events} withSnackbar withVisibility withOffline {...other}>
        <KWMProvider/>
        <HowlingProvider src={soundSrc} sprite={soundSprite}>
          <MainContainer>
            <ConnectedRouter history={history}>
              <Routes authenticated={!!user}/>
            </ConnectedRouter>
          </MainContainer>
        </HowlingProvider>
      </BaseContainer>
    );
  }
}

Main.propTypes = {
  offline: PropTypes.bool.isRequired,
  updateAvailable: PropTypes.bool.isRequired,
  a2HsAvailable: PropTypes.bool.isRequired,
  config: PropTypes.object,
  user: PropTypes.object,
  error: PropTypes.object,
  guest: PropTypes.object.isRequired,

  history: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => {
  const { offline, updateAvailable, config, user, error, notifications } = state.common;
  const { available: a2HsAvailable } = state.pwa.a2hs;
  const { guest } = state.meet;

  return {
    offline,
    updateAvailable,
    a2HsAvailable,
    config,
    user,
    guest,
    error,
    notifications,
  };
};

export default connect(mapStateToProps)(Main);
