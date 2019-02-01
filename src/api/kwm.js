import { networkFetch } from 'kpop/es/common/actions';

const defaultAPIPrefix = '/api/kwm/v2';

function apiURL(config, path) {
  const baseURL = config.kwm.url ? config.kwm.url : '';
  let uri = config.kwm ? config.kwm.apiPrefix ? config.kwm.apiPrefix : defaultAPIPrefix : defaultAPIPrefix;

  return baseURL + uri + path;
}

export function guestLogon(settings) {
  return (dispatch, getState) => {
    const { config } = getState().common;

    // FIXME(longsleep): Get response_type from kpop. It is currently hardcoded
    // unimportable there.
    const params = Object.assign({
      client_id: config.oidc.clientID, // eslint-disable-line camelcase
      response_type: 'id_token token', // eslint-disable-line camelcase
      iss: config.oidc.iss,
    }, settings);

    return dispatch(networkFetch(
      apiURL(config, '/guest/logon'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params).toString(),
      },
      200,
      true,
      false,
    ));
  };
}
