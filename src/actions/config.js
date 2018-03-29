import { getHeadersFromConfig } from '../utils';

const basePrefix = '';

export function receiveConfig(config) {
  return {
    type: 'RECEIVE_CONFIG',
    config,
  };
}

export function fetchConfig(id='config') {
  return (dispatch) => {
    return fetch(
      `${basePrefix}/api/${id}/v0/config`, {
        method: 'GET',
        headers: getHeadersFromConfig(),
      }
    ).then(res => {
      return res.json();
    }).then(config => {
      dispatch(receiveConfig(config));
      return Promise.resolve(config);
    }).catch(error => {
      // TODO(longsleep): Implement proper error handling via dispatch.
      throw error;
    });
  };
}
