import { getHeadersFromConfig } from 'kpop/es/config/utils';
import { networkFetch } from 'kpop/es/common/actions';

export function fetchUsers() {
  return (dispatch, getState) => {
    const { config, user } = getState().common;

    // TODO(longsleep): Add support for use cases when there are more than
    // 1000 users. Needs a logic change and rely exclusively on searching in
    // such cases.
    return dispatch(networkFetch(
      config.apiPrefix + '/users?$top=1000', {
        method: 'GET',
        headers: getHeadersFromConfig(config, user),
      },
      200,
      true,
      false,
    ));
  };
}
