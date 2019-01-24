import { getHeadersFromConfig } from 'kpop/es/config/utils';
import { networkFetch } from 'kpop/es/common/actions';

const defaultAPIPrefix = '/api/kvs/v1';

function apiURL(config, path) {
  let uri = config.kvs ? config.kvs.apiPrefix ? config.kvs.apiPrefix : defaultAPIPrefix : defaultAPIPrefix;

  return uri + path;
}

function get(key, realm = 'user', { raw=false, recurse=false } = {}) {
  return (dispatch, getState) => {
    const { config, user } = getState().common;

    let query = '';
    if (raw) {
      query += '&raw=1';
    }
    if (recurse) {
      query += '&recurse=1';
    }
    if (query) {
      query = '?' + query.substr(1);
    }

    return dispatch(networkFetch(
      apiURL(config, `/kv/${realm}/${key}${query}`), {
        method: 'GET',
        headers: getHeadersFromConfig(config, user),
      },
      200,
      raw === false,
      false,
    ));
  };
}

function createOrUpdate(key, value, realm = 'user', { batch=false } = {}) {
  return (dispatch, getState) => {
    const { config, user } = getState().common;

    let query = '';
    if (batch) {
      query += '&batch=1';
    }
    if (query) {
      query = '?' + query.substr(1);
    }

    return dispatch(networkFetch(
      apiURL(config, `/kv/${realm}/${key}${query}`), {
        method: 'PUT',
        headers: getHeadersFromConfig(config, user, {
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(value),
      },
      200,
      false,
      false,
    ));
  };
}

function del(key, realm = 'user') {
  return (dispatch, getState) => {
    const { config, user } = getState().common;

    return dispatch(networkFetch(
      apiURL(config, `/kv/${realm}/${key}`), {
        method: 'DELETE',
        headers: getHeadersFromConfig(config, user),
      },
      200,
      false,
      false,
    ));
  };
}

export default {
  get,
  createOrUpdate,
  del,
};
