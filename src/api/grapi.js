import { getHeadersFromConfig } from 'kpop/es/config/utils';
import { networkFetch } from 'kpop/es/common/actions';

export const contactsLocalFetchLimit = 100;

const defaultAPIPrefix = '/api/gc/v1';

function apiURL(config, path) {
  let uri = config.apiPrefix ? config.apiPrefix : defaultAPIPrefix;

  return uri + path;
}

export function fetchUsers() {
  return async (dispatch, getState) => {
    const { config } = getState().common;
    // Check if full GAB sync is disabled via config. If so, always search on
    // the server.
    if (config && config.disableFullGAB) {
      return null;
    }
    // Check if contacts result set is reasonably small.
    const test = await dispatch(fetchUsersWithParams({top: 1, skip: contactsLocalFetchLimit, select: 'id'}));
    if (test && test.value && test.value.length > 0) {
      return null;
    }
    // If so, fetch all contacts to local memory.
    return dispatch(fetchUsersWithParams());
  };
}

export function fetchUsersWithParams({top=contactsLocalFetchLimit, skip=0, select=null, search=null} = {}) {
  let url = `/users?$top=${top}&$skip=${skip}`;
  if (search) {
    url += `&$search=${search}`;
  }
  if (select) {
    url += `&$select=${select}`;
  }
  return (dispatch, getState) => {
    const { config, user } = getState().common;

    return dispatch(networkFetch(
      apiURL(config, url), {
        method: 'GET',
        headers: getHeadersFromConfig(config, user),
      },
      200,
      true,
      false,
    ));
  };
}

export function fetchUser(id) {
  return (dispatch, getState) => {
    const { config, user } = getState().common;
    let url = `/users/${id}`;

    return dispatch(networkFetch(
      apiURL(config, url), {
        method: 'GET',
        headers: getHeadersFromConfig(config, user),
      },
      200,
      true,
      false,
    ));
  };

}
