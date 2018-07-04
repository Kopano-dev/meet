import { basePath } from '../base';

import {
  KPOP_RECEIVE_OIDC_STATE,
} from 'kpop/es/oidc/constants';

const defaultState = {
  state: {
    pathname: '/' + window.location.pathname.split(`${basePath}/`, 2)[1],
  },
};

function oidcReducer(state = defaultState, action) {
  switch (action.type) {
    case KPOP_RECEIVE_OIDC_STATE:
      return Object.assign({}, state, {
        state: {...action.state},
      });

    default:
      return state;
  }
}

export default oidcReducer;
