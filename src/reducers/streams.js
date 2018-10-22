import {
  KWM_CALL_NEW,
  KWM_CALL_DESTROY,
  KWM_STREAM_RECEIVED,
} from '../actions/types';

const defaultMediaStream = new MediaStream();

const defaultState = {
};

function streamsReducer(state = defaultState, action) {
  switch (action.type) {
    case KWM_CALL_NEW: {
      if (state[action.record.user]) {
        // We already know this user, do nothing.
        return state;
      }
      const entry = {
        id: action.record.user,
        stream: defaultMediaStream,
        user: action.user,
        calling: true,
      };
      return Object.assign({}, state, {
        [action.record.user]: entry,
      });
    }

    case KWM_CALL_DESTROY: {
      const streams = Object.assign({}, state);
      delete streams[action.record.user];
      return streams;
    }

    case KWM_STREAM_RECEIVED: {
      const entry = Object.assign({}, state[action.record.user], {
        stream: action.stream,
        calling: false,
      });
      return Object.assign({}, state, {
        [action.record.user]: entry,
      });
    }

    default:
      return state;
  }
}

export default streamsReducer;
