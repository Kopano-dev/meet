import {
  USERMEDIA_AUDIOVIDEO_STREAM,
} from '../actions/types';

const defaultState = {
  umAudioVideoStreams: {},
};

function mediaReducer(state = defaultState, action) {
  switch (action.type) {
    case USERMEDIA_AUDIOVIDEO_STREAM: {
      const { id, stream } = action;
      const umAudioVideoStreams = Object.assign({}, state.umAudioVideoStreams);
      if (stream) {
        umAudioVideoStreams[id] = stream;
      } else {
        delete umAudioVideoStreams[id];
      }

      return Object.assign({}, state, {
        umAudioVideoStreams: umAudioVideoStreams,
      });
    }

    default:
      return state;
  }
}

export default mediaReducer;
