import { getHeadersFromConfig } from './utils';
import { networkError } from './actions/common';

function responseProcessor(dispatch, expectedStatus=200) {
  return async res => {
    if (res.status !== expectedStatus) {
      dispatch(networkError(res.status, res));
      throw res;
    }
    if (res.headers.get('Content-Type').indexOf('application/json') === 0) {
      return res.json();
    } else {
      // Return directly, if not JSON.
      return res;
    }
  };
}
