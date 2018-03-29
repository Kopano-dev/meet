import {
  SERVICE_WORKER_NEW_CONTENT,
} from '../actions/types';

const defaultState = {
  updateAvailable: false,
  config: null,
  user: null,
  error: null,
};

function commonReducer(state = defaultState, action) {
  switch (action.type) {
    case SERVICE_WORKER_NEW_CONTENT:
      return Object.assign({}, state, {
        updateAvailable: true,
      });

    case 'RESET_CONFIG':
      return Object.assign({}, state, {
        config: null,
      });

    case 'RECEIVE_CONFIG':
      return Object.assign({}, state, {
        config: action.config,
      });

    case 'RECEIVE_USER':
      return Object.assign({}, state, {
        user: action.user,
      });

    case 'ERROR':
      return Object.assign({}, state, {
        error: action.error,
      });

    default:
      return state;
  }
}

export default commonReducer;
