import { getHeadersFromConfig } from 'kpop/es/config/utils';
import { networkFetch } from 'kpop/es/common/actions';

export function fetchUsers() {
  return (dispatch, getState) => {
    const { config, user } = getState().common;

    return dispatch(networkFetch(
      config.apiPrefix + '/users', {
        method: 'GET',
        headers: getHeadersFromConfig(config, user),
      }
    ));
  };
}
