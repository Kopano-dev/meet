import {
  KPOP_RECEIVE_USER,
} from 'kpop/es/oidc/constants';

import {
  KWM_STATE_CHANGED,
  KWM_CHANNEL_CHANGED,
  KWM_DO_CALL,
  KWM_DO_ACCEPT,
  KWM_CALL_INCOMING,
  KWM_CALL_OUTGOING,
  KWM_CALL_DESTROY,
  KWM_PC_CONNECT,
  KWM_PC_CLOSED,
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
  calling: {},
  ringing: {},

  connections: {},

  options,
};

function kwmReducer(state = defaultState, action) {
  switch (action.type) {
    case KPOP_RECEIVE_USER:
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

    case KWM_DO_CALL: {
      const calling = Object.assign({}, state.calling, {
        [action.id]: true,
      });
      return Object.assign({}, state, {
        calling,
      });
    }

    case KWM_DO_ACCEPT: {
      const ringing = Object.assign({}, state.ringing);
      delete ringing[action.id];
      return Object.assign({}, state, {
        ringing,
      });
    }

    case KWM_CHANNEL_CHANGED:
      return Object.assign({}, state, {
        channel: action.channel,
      });

    case KWM_CALL_INCOMING: {
      const ringing = Object.assign({}, state.ringing, {
        [action.record.user]: {
          ignore: false,
          id: action.record.user,
        },
      });
      return Object.assign({}, state, {
        ringing,
      });
    }

    case KWM_CALL_OUTGOING: {
      const calling = Object.assign({}, state.calling);
      delete calling[action.record.user];
      return Object.assign({}, state, {
        calling,
      });
    }

    case KWM_CALL_DESTROY: {
      const ringing = Object.assign({}, state.ringing);
      const calling = Object.assign({}, state.calling);
      delete ringing[action.record.user];
      delete calling[action.record.user];
      return Object.assign({}, state, {
        ringing,
        calling,
      });
    }

    case KWM_PC_CONNECT: {
      const connections = Object.assign({}, state.connections, {
        [action.pc._id]: action.pc,
      });
      return Object.assign({}, state, {
        connections,
      });
    }

    case KWM_PC_CLOSED: {
      const connections = Object.assign({}, state.connections);
      delete connections[action.pc._id];
      return Object.assign({}, state, {
        connections,
      });
    }

    default:
      return state;
  }
}

export default kwmReducer;
