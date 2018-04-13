import {
  USERMEDIA_AUDIOVIDEO_STREAM,
} from '../actions/types';


const defaultState = {
  audioVideoStreams: {},
};

function usermediaReducer(state = defaultState, action) {
  switch (action.type) {
    case USERMEDIA_AUDIOVIDEO_STREAM: {
      const { id, stream } = action;
      const audioVideoStreams = Object.assign({}, state.audioVideoStreams);
      if (stream) {
        audioVideoStreams[id] = stream;
      } else {
        delete audioVideoStreams[id];
      }

      return Object.assign({}, state, {
        audioVideoStreams: audioVideoStreams,
      });
    }

    default:
      return state;
  }
}

export default usermediaReducer;
