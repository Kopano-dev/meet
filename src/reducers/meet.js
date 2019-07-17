import {
  KPOP_RECEIVE_USER,
} from 'kpop/es/oidc/constants';

import { scopeGuestOK } from 'kpop/es/oidc/scopes';

const defaultState = {
  guest: false,
};

function meetReducer(state = defaultState, action) {
  switch (action.type) {
    case KPOP_RECEIVE_USER:
      return Object.assign({}, state, {
        guest: action.user && action.user.scope.indexOf(scopeGuestOK) >= 0,
      });

    default:
      return state;
  }
}

export default meetReducer;
