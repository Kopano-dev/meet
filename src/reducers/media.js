import 'webrtc-adapter';

import {
  USERMEDIA_AUDIOVIDEO_STREAM,
  USERMEDIA_SET_DEVICEIDS,
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

  videoSourceId: '',
  audioSourceId: '',
  audioSinkId: '',
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

    case USERMEDIA_SET_DEVICEIDS: {
      const { videoSourceId, audioSourceId, audioSinkId } = action;
      const updates = {};
      if (videoSourceId !== undefined) {
        updates.videoSourceId = videoSourceId;
      }
      if (audioSourceId !== undefined) {
        updates.audioSourceId = audioSourceId;
      }
      if (audioSinkId !== undefined) {
        updates.audioSinkId = audioSinkId;
      }

      return Object.assign({}, state, updates);
    }

    default:
      return state;
  }
}

export default mediaReducer;
