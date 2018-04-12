import {
  KWM_STATE_CHANGED,
  KWM_CHANNEL_CHANGED,
} from '../actions/types';

// HACK(longsleep): special case, this object is used by reference in kwmjs.
// Do not replace reference in state.
const options = {
  ref: new Date(),
};

const defaultState = {
  connecting: false,
  connected: false,
  reconnecting: false,

  channel: null,
  calling: false,
  ringing: false,

  options,
};

function kwmReducer(state = defaultState, action) {
  switch (action.type) {
    case 'RECEIVE_USER':
      if (action.user) {
        // HACK(longsleep): Modify options directly, not replacing the refrence.
        options.authorizationType = action.user.token_type;
        options.authorizationValue = action.user.access_token;
      } else {
        options.authorizationType = '';
        options.authorizationValue = '';
      }
      return state;

    case KWM_STATE_CHANGED:
      return Object.assign({}, state, {
        connecting: action.connecting,
        connected: action.connected,
        reconnecting: action.reconnecting,
      });

    case KWM_CHANNEL_CHANGED:
      return Object.assign({}, state, {
        channel: action.channel,
      });

    default:
      return state;
  }
}

export default kwmReducer;
