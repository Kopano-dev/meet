import 'webrtc-adapter';

import { parseQuery } from 'kpop/es/utils';

import {
  USERMEDIA_AUDIOVIDEO_STREAM,
  USERMEDIA_SET_DEVICEIDS,
  USERMEDIA_SET_PENDING,
  DISPLAYMEDIA_SET_PENDING,
} from '../actions/types';
import {
  requestUserMedia,
} from '../actions/meet';

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

  settings: (() => {
    const hpr = parseQuery(window.location.hash.substr(1));
    const settings = {
      video: {},
      audio: {
        echoCancellation: true,
        autoGainControl: true,
        noiseSuppression: true,
      },
    };

    switch (hpr.hd) {
      case '':
      case undefined:
        break;

      case '0':
      case '360p':
        settings.video.idealWidth = 640;
        settings.video.idealHeight = 360;
        break;

      // 1080p:
      case '2':
      case '1080p':
        settings.video.idealWidth = 1920;
        settings.video.idealHeight = 1080;
        break;

      // 4k
      case '3':
      case '4k':
        settings.video.idealWidth = 4096;
        settings.video.idealHeight = 2160;
        break;

      // 720p:
      case '1':
      case '720p':
      default:
        settings.video.idealWidth = 1280;
        settings.video.idealHeight = 720;
        break;
    }

    if ('stereo' in hpr) {
      settings.audio.channelCount = 2;
    } else {
      settings.audio.channelCount = 1;
    }

    return settings;
  })(),
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
      if (videoSourceId !== undefined && videoSourceId !== state.videoSourceId) {
        updates.videoSourceId = videoSourceId;
      }
      if (audioSourceId !== undefined && audioSourceId !== state.audioSourceId) {
        updates.audioSourceId = audioSourceId;
      }
      if (audioSinkId !== undefined && audioSinkId !== state.audioSinkId) {
        updates.audioSinkId = audioSinkId;
      }

      if (updates.videoSourceId !== undefined || updates.audioSourceId !== undefined) {
        // Whenever video our audio source changes, trigger new rum.
        action.queueDispatch(requestUserMedia());
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
