import 'webrtc-adapter';

import {
  USERMEDIA_AUDIOVIDEO_STREAM,
  USERMEDIA_SET_DEVICEIDS,
  USERMEDIA_SET_PENDING,
  DISPLAYMEDIA_SET_PENDING,
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

  umAudioPending: false,
  umVideoPending: false,
  dmPending: false,
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

    case USERMEDIA_SET_PENDING: {
      const updates = {};
      const { video, audio } = action;
      if (video !== undefined) {
        updates.umVideoPending = video;
      }
      if (audio !== undefined) {
        updates.umAudioPending = audio;
      }

      return Object.assign({}, state, updates);
    }

    case DISPLAYMEDIA_SET_PENDING: {
      const { pending } = action;
      if (pending !== undefined) {
        return Object.assign({}, state, {
          dmPending: pending,
        });
      }

      return state;
    }

    default:
      return state;
  }
}

export default mediaReducer;
