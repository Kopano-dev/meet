import 'webrtc-adapter';

import {
  USERMEDIA_AUDIOVIDEO_STREAM,
} from '../actions/types';

const defaultState = {
  gUMSupported: (
    navigator.mediaDevices &&
    navigator.mediaDevices.enumerateDevices &&
    navigator.mediaDevices.getUserMedia &&
    true)
    || false,
  gDMSupported: (
    navigator.mediaDevices &&
    navigator.mediaDevices.getDisplayMedia &&
    true)
    || false,

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
