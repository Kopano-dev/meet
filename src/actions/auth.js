/* eslint-disable no-console */

import { UserManager } from 'oidc-client';

const appBaseURL = window.location.href.split('/meet/')[0] + '/meet/';
const callbackURL =  appBaseURL + '#oidc-callback';
const silentRedirectURL = appBaseURL + 'oidc-silent-refresh.html';
let userManager = null;

console.info('Using auth app base URL', appBaseURL);

export function receiveUser(user) {
  return {
    type: 'RECEIVE_USER',
    user,
  };
}

export function fetchUser() {
  return async (dispatch) => {
    if (userManager === null) {
      userManager = await dispatch(createUserManager(callbackURL));
    }

    return userManager.getUser().then(user => {
      if (user !== null) {
        return user;
      }

      if (window.location.href.indexOf(callbackURL) === 0) {
        return userManager.signinRedirectCallback().then(user => {
          console.info('completed authentication', user); // eslint-disable-line no-console
          return user;
        }).catch((err) => {
          console.error('failed to complete authentication', err); // eslint-disable-line no-console
          return null;
        }).then(user => {
          window.location.hash = '';
          return user;
        });
      } else {
        // Not on the callback, so redirect to sign in.
        return userManager.signinRedirect();
      }
    }).then(async user => {
      await dispatch(receiveUser(user));

      return user;
    });
  };
}

function _createUserManager(config) {
  return new UserManager(config);
}

export function createUserManager() {
  return (dispatch, getState) => {
    const { config } = getState().common;
    let iss = config.oidc.iss;
    if (iss === '') {
      // Auto generate issuer with current host.
      iss = 'https://' + window.location.host;
    }

    const mgr = _createUserManager({
      authority: config.oidc.iss,
      client_id: config.oidc.clientID, // eslint-disable-line camelcase
      redirect_uri: callbackURL,       // eslint-disable-line camelcase
      response_type: 'id_token token', // eslint-disable-line camelcase
      scope: 'openid profile email konnect/uuid',
      loadUserInfo: true,
      accessTokenExpiringNotificationTime: 120,
      silent_redirect_uri: silentRedirectURL,  // eslint-disable-line camelcase
      automaticSilentRenew: true,
      includeIdTokenInSilentRenew: true,
    });
    mgr.events.addAccessTokenExpiring(() => {
      console.log('token expiring');
    });
    mgr.events.addAccessTokenExpired(() => {
      console.log('access token expired');
      mgr.removeUser();
    });
    mgr.events.addUserLoaded(async user => {
      console.log('user loaded', user);
      await dispatch(receiveUser(user));
    });
    mgr.events.addUserUnloaded(async () => {
      console.log('user unloaded');
      await dispatch(receiveUser(null));
      await dispatch(fetchUser());
    });
    mgr.events.addSilentRenewError(err => {
      console.log('user silent renew error', err.error);
      if (err && err.error === 'interaction_required') {
        // Handle the hopeless.
        return;
      }

      setTimeout(() => {
        console.log('retrying silent renew');
        mgr.getUser().then(user => {
          console.log('retrying silent renew of user', user);
          if (user && !user.expired) {
            mgr.startSilentRenew();
          } else {
            console.log('remove user as silent renew has failed to renew in time');
            mgr.removeUser();
          }
        });
      }, 5000);
    });
    mgr.events.addUserSignedOut(() => {
      console.log('user signed out');
    });

    return Promise.resolve(mgr);
  };
}
