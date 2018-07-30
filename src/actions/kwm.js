import { setError } from 'kpop/es/common/actions';

import * as kwmjs from 'kwmjs';

import * as types from './types';
import * as sdputils from '../sdputils';
import { forceBase64URLEncoded } from '../utils';

console.info(`Kopano KWM js version: ${kwmjs.version}`); // eslint-disable-line no-console

// Reference to the active KWM.
let kwm = null;

// KWM config.
const kwmConfig = {
  url: '',
  webrtc: {
    config: {
      iceServers: [
        {urls: 'stun:stun.l.google.com:19302'},
        {urls: 'stun:stun.sipgate.net:3478'},
      ],
    },
  },
  sdpParams: {},
};

// WebRTC options.
const webrtcOptions = {
  answerConstraints: {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,

    googCpuOveruseDetection: true,
    googCpuOveruseEncodeUsage: true,
    googCpuUnderuseThreshold: 55,
    googCpuOveruseThreshold: 85,
    googHighStartBitrate: true,
    googPayloadPadding: true,
  },
  offerConstraints: {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,

    googCpuOveruseDetection: true,
    googCpuOveruseEncodeUsage: true,
    googCpuUnderuseThreshold: 55,
    googCpuOveruseThreshold: 85,
    googHighStartBitrate: true,
    googPayloadPadding: true,
  },
};

// SDP Config.
const sdpParams = {
  videoRecvCodec: 'VP9',

  opusDtx: true,
};

export function connectToKWM() {
  return async (dispatch, getState) => {
    const { user } = getState().common;
    const { options } = getState().kwm;

    if (user === null || !options.authorizationType) {
      throw new Error('no user or options set for KWM connect');
    }
    if (kwm === null) {
      kwm = await dispatch(createKWMManager());
    }

    return kwm.connect(user.profile.sub);
  };
}

function createKWMManager() {
  return async (dispatch, getState) => {
    const { config } = getState().common;
    const { options } = getState().kwm;

    if (!config.kwm) {
      throw new Error('config is missing KWM configuration data');
    }

    // Update defaults from configuration.
    Object.assign(kwmConfig, config.kwm);
    Object.assign(webrtcOptions, kwmConfig.webrtc.options);
    Object.assign(sdpParams, kwmConfig.sdpParams);

    kwmjs.KWMInit.init({}); // Init with default options.
    const k = new kwmjs.KWM(kwmConfig.url, options);
    k.webrtc.config = {
      ...kwmConfig.webrtc.config,
    };
    k.webrtc.options = {
      ...webrtcOptions,
      localSDPTransform: (sdp) => {
        // Local SDP transform support.
        const params = Object.assign({}, sdpParams, {
          // TODO(longsleep): Add configuration settings here.
        });
        sdp = sdputils.maybePreferAudioReceiveCodec(sdp, params);
        sdp = sdputils.maybePreferVideoReceiveCodec(sdp, params);
        sdp = sdputils.maybeSetAudioReceiveBitRate(sdp, params);
        sdp = sdputils.maybeSetVideoReceiveBitRate(sdp, params);
        sdp = sdputils.maybeRemoveVideoFec(sdp, params);
        return sdp;
      },
      remoteSDPTransform: (sdp) => {
        // Remote SDP transform support.
        const params = Object.assign({}, sdpParams, {
          // TODO(longsleep): Add configuration settings here.
        });
        sdp = sdputils.maybeSetOpusOptions(sdp, params);
        sdp = sdputils.maybePreferAudioSendCodec(sdp, params);
        sdp = sdputils.maybePreferVideoSendCodec(sdp, params);
        sdp = sdputils.maybeSetAudioSendBitRate(sdp, params);
        sdp = sdputils.maybeSetVideoSendBitRate(sdp, params);
        sdp = sdputils.maybeSetVideoSendInitialBitRate(sdp, params);
        sdp = sdputils.maybeRemoveVideoFec(sdp, params);
        return sdp;
      },
    };
    console.info('KWM init', kwmConfig, webrtcOptions, sdpParams); // eslint-disable-line no-console

    k.onstatechanged = event => {
      if (event.target !== kwm) {
        return;
      }

      dispatch(stateChanged(event));
    };
    k.onerror = event => {
      if (event.target !== kwm) {
        return;
      }

      dispatch(error(event));
    };
    k.onturnserverchanged = event => {
      console.info('KWM using TURN servers', event.iceServer.urls); // eslint-disable-line no-console
    };
    k.webrtc.onpeer = event => {
      if (event.target.kwm !== kwm) {
        return;
      }

      switch (event.event) {
        case 'newcall':
          dispatch(newCall(event));
          break;
        case 'destroycall':
          dispatch(destroyAndHangupCall(event));
          break;
        case 'abortcall':
          dispatch(abortAndHangupCall(event));
          break;
        case 'incomingcall':
          dispatch(incomingCall(event));
          break;
        case 'outgoingcall':
          dispatch(outgoingCall(event));
          break;

        case 'pc.connect':
          dispatch(pcConnect(event));
          break;
        case 'pc.closed':
          dispatch(pcClosed(event));
          break;
        case 'pc.signalingStateChange':
          dispatch(pcStateChanged(event));
          break;

        // Reduce logging.
        case 'pc.iceStateChange':
        case 'pc.error':
          //console.debug(`KWM event ${event.event}`, event.details, event.record);
          break;

        // Catch unknowns.
        default:
          console.warn('KWM unknown peer event', event.event, event); // eslint-disable-line no-console
          break;
      }

      if (event.target.peers.size === 0 && event.target.channel !== '' && !event.target.group) {
        console.log('KWM hangup as no peers are left'); // eslint-disable-line no-console
        dispatch(doHangup());
      }
    };
    k.webrtc.onstream = event => {
      if (event.target.kwm !== kwm) {
        return;
      }

      const { table } = getState().contacts;
      const user = table[forceBase64URLEncoded(event.record.user)];
      event.user = {displayName: user.displayName};
      dispatch(streamReceived(event));
    };

    return k;
  };
}

function error(event) {
  return async (dispatch) => {
    console.warn('KWM error event', event.code, event); // eslint-disable-line no-console

    let fatal = true;
    switch (event.code) {
      case 'no_session_for_user':
        // NOTE(longsleep): This error is pretty useless as it does not return
        // enough information to know which call actually is meant here.
        console.warn('KMW error ignored', event.code, event); // eslint-disable-line no-console
        return;
      default:
    }

    // TODO(longsleep): Make only fatal if kwm is not reconnecting.
    const error = {
      message: `Error: KWM error - ${event.msg} (${event.code})`,
      fatal: fatal,
    };

    dispatch(doHangup());
    await dispatch(setError(error));
  };
}

function stateChanged(event) {
  const { connecting, connected, reconnecting } = event;

  return {
    type: types.KWM_STATE_CHANGED,
    connecting,
    connected,
    reconnecting,
  };
}

function channelChanged(channel) {
  return {
    type: types.KWM_CHANNEL_CHANGED,
    channel,
  };
}

function incomingCall(event, doneHandler = null) {
  const { record } = event;

  return {
    type: types.KWM_CALL_INCOMING,
    record,
    doneHandler,
  };
}

function outgoingCall(event, doneHandler = null) {
  const { record } = event;

  return {
    type: types.KWM_CALL_OUTGOING,
    record,
    doneHandler,
  };
}


/*
function incomingCallWithTimeout(event) {
  return dispatch => {
    return new Promise((resolve, reject) => {
      const t = setTimeout(reject, 5000);
      dispatch(incomingCall(event, (...args) => {
        clearTimeout(t);
        resolve(...args);
      }));
    }).catch(() => {
      console.log('timeout');
    });
  };
}*/

function newCall(event) {
  const { record } = event;

  return {
    type: types.KWM_CALL_NEW,
    record,
  };
}

function destroyCall(event) {
  const { record } = event;

  // TODO(longsleep): Reconnect instead of hangup?
  if (kwm.webrtc.peers.get(record.user)) {
    kwm.webrtc.doHangup(record.user);
  }

  return {
    type: types.KWM_CALL_DESTROY,
    record,
  };
}

function pcConnect(event) {
  const { record } = event;

  return {
    type: types.KWM_PC_CONNECT,
    record,
  };
}

function pcClosed(event) {
  const { record } = event;

  return {
    type: types.KWM_PC_CLOSED,
    record,
  };
}

function pcStateChanged(event) {
  const { record } = event;

  return {
    type: types.KWM_PC_STATE_CHANGED,
    record,
  };
}

function destroyAndHangupCall(event) {
  const { record } = event;

  return async dispatch => {
    dispatch(destroyCall(event));
    if (kwm.webrtc.peers.get(record.user)) {
      await kwm.webrtc.doHangup(record.user);
    }
  };
}

function abortCall(event) {
  const { record, details } = event;

  return {
    type: types.KWM_CALL_ABORT,
    record,
    details,
  };
}

function abortAndHangupCall(event) {
  const { record } = event;

  return async dispatch => {
    dispatch(abortCall(event));
    if (kwm.webrtc.peers.get(record.user)) {
      await kwm.webrtc.doHangup(record.user);
    }
  };
}

function streamReceived(event) {
  const { record, stream, user } = event;

  return {
    type: types.KWM_STREAM_RECEIVED,
    record,
    stream,
    user,
  };
}

export function doCall(id) {
  return async dispatch => {
    await dispatch({
      type: types.KWM_DO_CALL,
      id,
    });
    return kwm.webrtc.doCall(id).then(channel => {
      console.info('KWM channel create', channel); // eslint-disable-line no-console
      dispatch(channelChanged(channel));
      return channel;
    });
  };
}

export function doHangup(id='', reason) {
  return async dispatch => {
    // Hangs up all and everyone
    await dispatch({
      type: types.KWM_DO_HANGUP,
      id,
      reason,
    });
    return kwm.webrtc.doHangup(id, reason).then(channel => {
      console.info('KWM channel release', channel); // eslint-disable-line no-console
      dispatch(channelChanged(null));
    });
  };
}

export function doGroup(id) {
  return async dispatch => {
    await dispatch({
      type: types.KWM_DO_GROUP,
      id,
    });
    return kwm.webrtc.doGroup(id).then(channel => {
      console.info('KWM group channel create', channel); // eslint-disable-line no-console
      dispatch(channelChanged(channel));
      return channel;
    });
  };
}

export function doAccept(id) {
  return async dispatch => {
    await dispatch({
      type: types.KWM_DO_ACCEPT,
      id,
    });
    return kwm.webrtc.doAnswer(id).then(channel => {
      console.info('KWM channel create', channel); // eslint-disable-line no-console
      dispatch(channelChanged(channel));
      return channel;
    });
  };
}

export function doReject(id, reason='reject') {
  return async dispatch => {
    await dispatch({
      type: types.KWM_DO_REJECT,
      id,
      reason,
    });
    return kwm.webrtc.doHangup(id, reason);
  };
}

export function setLocalStream(stream) {
  return async () => {
    console.info('KWM setting local stream', stream); // eslint-disable-line no-console
    kwm.webrtc.setLocalStream(stream);
    return stream;
  };
}

export function unsetLocalStream() {
  return async () => {
    console.info('KWM unsetting local stream'); // eslint-disable-line no-console
    if (kwm) {
      kwm.webrtc.setLocalStream(); // clears.
    }
  };
}

export function updateOfferAnswerConstraints(options) {
  return async () => {
    console.info('KWM update offer/answer constaints', options); // eslint-disable-line no-console
    Object.assign(webrtcOptions.answerConstraints, options);
    Object.assign(webrtcOptions.offerConstraints, options);

    if (kwm) {
      Object.assign(kwm.webrtc.options, webrtcOptions);
    }
  };
}

export function applyLocalStreamTracks(info) {
  return async dispatch => {
    if (!info || !info.stream) {
      return info;
    }

    console.info('KWM updating local stream tracks', info); // eslint-disable-line no-console
    if (kwm) {
      if (info.newStream) {
        return dispatch(setLocalStream(info.newStream));
      }

      for (const track of info.removedTracks) {
        kwm.webrtc.removeLocalStreamTrack(track, info.stream);
      }
      for (const track of info.newTracks) {
        kwm.webrtc.addLocalStreamTrack(track, info.stream);
      }
    }
    return info;
  };
}
