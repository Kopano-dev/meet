import { networkFetch } from 'kpop/es/common/actions';

const defaultAPIPrefix = '/api/kwm/v2';

function apiURL(config, path) {
  const baseURL = config.kwm.url ? config.kwm.url : '';
  let uri = config.kwm ? config.kwm.apiPrefix ? config.kwm.apiPrefix : defaultAPIPrefix : defaultAPIPrefix;

  return baseURL + uri + path;
}

// NOTE(longsleep): Guest logon is special that it gets passed config directly
// instead of retrieving it from the store. This is required to ensure that
// the function can be called while still retrieving config.
export function guestLogon(config, path=null, token=null) {
  return (dispatch) => {
    const params = {
      client_id: config.oidc.clientID, // eslint-disable-line camelcase
      iss: config.oidc.iss,
    };
    if (path) {
      params.path = path;
    }
    if (token) {
      params.token = token;
    }

    return dispatch(networkFetch(
      apiURL(config, '/guest/logon'), {
        method: 'POST',
        body: new URLSearchParams(params),
      },
      200,
      true,
      false,
    ));
  };
}
