import { setError } from 'kpop/es/common/actions';

import * as kwmjs from 'kwmjs';
import adapter from 'webrtc-adapter';

import * as types from './types';
import * as errors from '../errors';
import * as sdputils from '../sdputils';
import { fetchAndUpdateContactByID } from './contacts';
import { resolveContactIDFromRecord } from '../utils';

console.info(`Kopano KWM js version: ${kwmjs.version}`); // eslint-disable-line no-console

const defaultAudioVideoSdpParams = {
  videoRecvCodec: 'VP8', // Prefer VP8 since it takes less CPU?
  videoSendBitrate: 1000, // kbps
  videoRecvBitrate: 1000, // kbps

  opusDtx: true,
};

const defaultScreenhareSdpParams = {
  videoRecvCodec: 'VP9', // Prefer VP9 since its more modern and gives better results for screen sharing.
  videoSendBitrate: 2500, // kbps
  videoRecvBitrate: 2500, // kbps
};

// Fixup webrtc-adpter for Firefox to be compatible with kwmjs simple-peer poor feature detection.
// See https://github.com/feross/simple-peer/commits/master/index.js and ensure it ends up to detect promise based shit.
(() => {
  if (adapter.browserDetails.browser === 'firefox') {
    // Ensure that function signature of getStats has zero parameters, so that
    // the feature detection of kwmks simple-peer does select the promise based
    // mode.
    if (window.RTCPeerConnection.prototype.getStats.length > 0) {
      const adaptedGetStats = window.RTCPeerConnection.prototype.getStats;
      window.RTCPeerConnection.prototype.getStats = function() {
        return adaptedGetStats.apply(this);
      };
    }
  }
})();

// Reference to the active KWM and options.
let kwm = null;
const kwmOptions = {
  id: null,
  user: null,
  userMode: 'id_token',
  options: {},
};

// KWM config.
const kwmConfig = (() => {
  const config ={
    url: '',
    webrtc: {},
    sdpParams: {},
  };

  return config;
})();


// Default WebRTC constraints.
const defaultCommonConstraints = (() => {
  const constraints = {};

  if (adapter.browserDetails.browser === 'chrome') {
    // Add Google specific constraints.
    Object.assign(constraints, {
      googIPv6: true, // Constraint to enable IPv6 through JS.
      googDscp: true, // Temporary pseudo-constraint for enabling DSCP through JS.

      // Google specific constraints.
      googCpuOveruseDetection: true,
      googCpuOveruseEncodeUsage: true,
      googCpuUnderuseThreshold: 55,
      googCpuOveruseThreshold: 85,
      googHighStartBitrate: 0,
      googPayloadPadding: true,
      googSuspendBelowMinBitrate: true,
      googScreencastMinBitrate: 400,
    });
  }

  return constraints;
})();

// WebRTC confg.
const webrtcConfig = (() => {
  const config = {
    iceServers: [
      {urls: 'stun:stun.kopano.com:443'},
    ],
    iceTransportPolicy: 'all', // Either 'all' or 'relay' to force going through relay.
  };

  if (adapter.browserDetails.browser === 'chrome') {
    // For interoperability with Firefox and others, we need to send standard sdp. This sets the plan to unified plan
    // effectively breaking compatibilty with Chromeium < M69. See https://webrtc.org/web-apis/chrome/unified-plan/.
    config.sdpSemantics = 'unified-plan';
  }

  return config;
})();

// WebRTC options.
const webrtcOptions = {
  answerConstraints: {
    ...defaultCommonConstraints,
  },
  offerConstraints: {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,

    ...defaultCommonConstraints,
  },
};

// SDP Config.
const sdpParamsAudioVideo = {
  ...defaultAudioVideoSdpParams,
};
const sdpParamsScreenshare = {
  ...defaultScreenhareSdpParams,
};

export function setupKWM(id, idToken, {authorizationType, authorizationValue, autoConnect, eventCallback} = {}) {
  return async (dispatch, getState) => {
    const { config } = getState().common;

    if (id !== kwmOptions.id) {
      // Always disconnect when the user changed.
      await dispatch(disconnectFromKWM());
    }

    // Update KWM options by reference.
    kwmOptions.id = id;
    kwmOptions.user = idToken;
    Object.assign(kwmOptions.options, {
      authorizationType,
      authorizationValue,
      authorizationAuth: config.useIdentifiedUser ? '1' : '', // Use auth 1 to use real user identity.
    });

    // Auto connect support when requested.
    if (autoConnect && kwm === null) {
      return dispatch(connectToKWM(idToken, eventCallback));
    }

    return kwm;
  };
}

export function destroyKWM() {
  return async (dispatch) => {
    if (kwm) {
      await dispatch(disconnectFromKWM());
      kwm = null;
    }
  };
}

function connectToKWM(user, eventCallback) {
  return async (dispatch) => {
    if (!user || kwmOptions.user !== user) {
      throw new Error('invalid user set for KWM connect');
    }
    if (!kwmOptions.options.authorizationType) {
      throw new Error('no user or options set for KWM connect');
    }
    if (kwm === null) {
      kwm = await dispatch(createKWMManager(eventCallback));
    }

    await kwm.connect(user, kwmOptions.userMode);
    return kwm;
  };
}

function disconnectFromKWM() {
  return async () => {
    if (kwm) {
      try {
        await kwm.destroy();
      } catch(err) {
        console.error('disconnect destroy failed with error', err); // eslint-disable-line no-console
      }
    }
    kwmOptions.id = null;
    kwmOptions.user = null;
    delete kwmOptions.options.authorizationType;
    delete kwmOptions.options.authorizationValue;
  };
}

function createKWMManager(eventCallback) {
  return async (dispatch, getState) => {
    const { config } = getState().common;

    if (!config.kwm) {
      throw new Error('config is missing KWM configuration data');
    }

    // Update defaults from configuration.
    Object.assign(kwmConfig, config.kwm);
    Object.assign(webrtcConfig, kwmConfig.webrtc.config);
    Object.assign(webrtcOptions, kwmConfig.webrtc.options);
    Object.assign(sdpParamsAudioVideo, kwmConfig.sdpParams);
    Object.assign(sdpParamsScreenshare, kwmConfig.sdpParamsScreenshare);

    kwmjs.KWMInit.init({}); // Init with default options.
    const k = new kwmjs.KWM(kwmConfig.url, kwmOptions.options);
    k.webrtc.config = {
      ...webrtcConfig,
    };
    k.webrtc.options = {
      ...webrtcOptions,
      localSDPTransform: (sdp, kind='') => {
        let sdpParams;
        switch (kind) {
          case 'screenshare':
            sdpParams = sdpParamsScreenshare;
            break;
          default:
            sdpParams = sdpParamsAudioVideo;
            break;
        }
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
      remoteSDPTransform: (sdp, kind='') => {
        let sdpParams;
        switch (kind) {
          case 'screenshare':
            sdpParams = sdpParamsScreenshare;
            break;
          default:
            sdpParams = sdpParamsAudioVideo;
            break;
        }
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
    console.info('KWM init', kwmConfig, webrtcConfig, webrtcOptions, sdpParamsAudioVideo, sdpParamsScreenshare); // eslint-disable-line no-console

    k.onstatechanged = event => {
      if (event.target !== kwm) {
        return;
      }

      if (event.connected) {
        // Ensure that all existing pc connections do a renegotiation dance after
        // kwm server connection to ensure server state is correct.
        kwm.webrtc.peers.forEach(record => {
          if (record.pc) {
            record.pc._needsNegotiation();
          }
        });
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
      if (!kwm || event.target !== kwm.webrtc) {
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

        case 'pc.iceStateChange':
          // TODO(longsleep): Implement iceRestart.
          // See https://github.com/w3c/webrtc-pc/pull/1910#issuecomment-398986406
          // and https://w3c.github.io/webrtc-pc/#dom-rtcofferoptions-icerestart.
          break;

        // Reduce logging.
        case 'pc.new':
        case 'pc.signalingStateChange':
        case 'pc.error':
        case 'hangup':
          //console.debug(`KWM event ${event.event}`, event.details, event.record);
          break;

        // Catch unknowns.
        default:
          console.warn('KWM unknown peer event', event.event, event); // eslint-disable-line no-console
          break;
      }

      // Cleanup if no peers are left.
      if (event.target.peers.size === 0) {
        if (event.target.channel !== '' && !event.target.group) {
          console.log('KWM hangup as no peers are left'); // eslint-disable-line no-console
          dispatch(doHangup());
        } else if (event.target.channel === '') {
          // Reset channel when not having a channel and no peers.
          dispatch(resetChannel());
        }
      }

      if (eventCallback) {
        eventCallback(event);
      }
    };
    k.webrtc.onannouncestreams = event => {
      if (!kwm || event.target !== kwm.webrtc) {
        return;
      }

      dispatch(streamsAnnounce(event));
    };
    k.webrtc.ontrack = event => {
      if (!kwm || event.target !== kwm.webrtc) {
        return;
      }

      dispatch(streamReceived(event));
    };

    return k;
  };
}

function error(event) {
  return async (dispatch) => {
    let fatal = true;
    switch (event.code) {
      case 'no_session_for_user':
        // NOTE(longsleep): This error is pretty useless as it does not return
        // enough information to know which call actually is meant here.
        console.debug('KMW error ignored', event.code, event); // eslint-disable-line no-console
        return;
      case 'http_error_403':
        // NOTE(longsleep): For whatever reason we were not allowed to
        // connect KWM. Do something useful instead of just bailing
        // with the error since this can happen when the access token
        // is expired (like after a device resume).
        dispatch(doHangup());
        await setNonFatalError(errors.ERROR_KWM_NO_PERMISSION, event);
        return;
      default:
    }

    console.warn('KWM error event', event.code, event); // eslint-disable-line no-console

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

function newCall(event) {
  const { record } = event;
  return async (dispatch, getState) => {
    const state = getState();
    const { table } = state.contacts;
    const { config } = state.common;

    const id = resolveContactIDFromRecord(config, event.record);
    let entry = table[id];
    if (!entry) {
      console.warn('unknown user for call', event.record.user); // eslint-disable-line no-console
      entry = {
        // TODO(longsleep): Find some way to describe unknown users.
        displayName: '',
      };
      // Try to fetch contact data via api.
      dispatch(fetchAndUpdateContactByID(id)).catch(err => {
        console.warn('failed to fetch and update contact' + // eslint-disable-line no-console
        ' information for new call', err);
      });
    }
    // Copy to retain reference.
    const user = {displayName: entry.displayName};

    return dispatch({
      type: types.KWM_CALL_NEW,
      record,
      user,
    });
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
  const { record, details: pc } = event;

  return {
    type: types.KWM_PC_CONNECT,
    record,
    pc,
  };
}

function pcClosed(event) {
  const { record, details: pc } = event;

  return {
    type: types.KWM_PC_CLOSED,
    record,
    pc,
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
  const { record, stream, token } = event;

  return {
    type: types.KWM_STREAM_RECEIVED,
    record,
    stream,
    token,
  };
}

function streamsAnnounce(event) {
  const { record, added, removed } = event;

  return {
    type: types.KWM_STREAMS_ANNOUNCE,
    record,
    added,
    removed,
  };
}

function resetChannel() {
  return async (dispatch, getState) => {
    const { channel } = getState().kwm;
    if (channel) {
      await dispatch(channelChanged(null));
    }
  };
}

function setNonFatalError(text, err) {
  if (err) {
    // TODO(longsleep): Pure man error conversion follows. This needs real
    // messages for the known errors and translation.
    if (err.msg) {
      err = err.msg;
    } else if (err.code) {
      err = (''+err.code).replace('_', ' ');
    }
    text += ' - ' + err;
  }

  return async dispatch => {
    await dispatch(setError({
      message: text,
      fatal: false,
    }));
  };
}

export function doCall(id, errorCallback) {
  return async dispatch => {
    if (!kwm || !kwm.webrtc) {
      throw new Error('no kwm');
    }
    await dispatch({
      type: types.KWM_DO_CALL,
      id,
    });
    return kwm.webrtc.doCall(id).then(channel => {
      console.info('KWM channel create', channel); // eslint-disable-line no-console
      dispatch(channelChanged(channel));
      return channel;
    }).catch(err => {
      dispatch({
        type: types.KWM_CLEAR_CALLING,
        id,
      });
      dispatch(doHangup(id, '')); // Hangup without reason is a local hangup.
      err = errorCallback ? errorCallback(err) : err;
      if (err) {
        console.error('KWM doCall failed', err);  // eslint-disable-line no-console
        dispatch(setNonFatalError(errors.ERROR_KWM_UNABLE_TO_CALL, err));
      }
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
    if (!kwm || !kwm.webrtc) {
      return;
    }
    return kwm.webrtc.doHangup(id, reason).then(channel => {
      console.info('KWM channel release', channel); // eslint-disable-line no-console
      dispatch(resetChannel());
    }).catch(err => {
      dispatch(doHangup(id, '')); // Hangup without reason is a local hangup.
      console.error('KWM doHangup failed', err);  // eslint-disable-line no-console
      // FIXME(longsleep): Only hang up locally is probably not ideal - maybe
      // an error message should be shown?
    });
  };
}

export function doGroup(id, errorCallback) {
  return async dispatch => {
    if (!kwm || !kwm.webrtc) {
      throw new Error('no kwm');
    }
    await dispatch({
      type: types.KWM_DO_GROUP,
      id,
    });
    return kwm.webrtc.doGroup(id).then(channel => {
      console.info('KWM group channel create', channel); // eslint-disable-line no-console
      dispatch(channelChanged(channel));
      return channel;
    }).catch(err => {
      err = errorCallback ? errorCallback(err) : err;
      if (err) {
        console.error('KWM doGroup failed', err);  // eslint-disable-line no-console
        dispatch(setNonFatalError(error.ERROR_KWM_UNABLE_TO_JOIN, err));
      }
    });
  };
}

export function doAccept(id) {
  return async dispatch => {
    if (!kwm || !kwm.webrtc) {
      throw new Error('no kwm');
    }
    await dispatch({
      type: types.KWM_DO_ACCEPT,
      id,
    });
    return kwm.webrtc.doAnswer(id).then(channel => {
      console.info('KWM channel create', channel); // eslint-disable-line no-console
      dispatch(channelChanged(channel));
      return channel;
    }).catch(err => {
      console.error('KWM doAccept failed', err);  // eslint-disable-line no-console
      dispatch(setNonFatalError(error.ERROR_KWM_UNABLE_TO_ACCEPT, err));
    });
  };
}

export function doReject(id, reason='reject') {
  return async dispatch => {
    if (!kwm || !kwm.webrtc) {
      throw new Error('no kwm');
    }
    await dispatch({
      type: types.KWM_DO_REJECT,
      id,
      reason,
    });
    return kwm.webrtc.doReject(id, reason).catch(err => {
      console.error('KWM doReject failed', err);  // eslint-disable-line no-console
      dispatch(doHangup(id, '')); // Hangup without reason is a local hangup.
      // FIXME(longsleep): Only hang up locally is probably not ideal - maybe
      // an error message should be shown?
    });
  };
}

export function doIgnore(id) {
  return {
    type: types.KWM_DO_IGNORE,
    id,
  };
}

export function setLocalStream(stream) {
  return async () => {
    console.info('KWM setting local stream', stream); // eslint-disable-line no-console
    if (kwm && kwm.webrtc) {
      kwm.webrtc.setLocalStream(stream);
    }
    return stream;
  };
}

export function unsetLocalStream() {
  return async () => {
    console.info('KWM unsetting local stream'); // eslint-disable-line no-console
    if (kwm && kwm.webrtc) {
      kwm.webrtc.setLocalStream(); // clears.
    }
  };
}

export function setScreenshareStream(id, stream) {
  return async () => {
    console.info('KWM setting screen share stream', id, stream); // eslint-disable-line no-console
    if (kwm && kwm.webrtc) {
      kwm.webrtc.setScreenshareStream(id, stream);
    }
    return stream;
  };
}

export function updateOfferAnswerConstraints(options) {
  return async () => {
    console.info('KWM update offer/answer constaints', options); // eslint-disable-line no-console
    Object.assign(webrtcOptions.answerConstraints, options);
    Object.assign(webrtcOptions.offerConstraints, options);

    if (kwm && kwm.webrtc) {
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
    if (kwm && kwm.webrtc) {
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

export function getStatsForAllConnections() {
  return async (dispatch, getState) => {
    const { connections } = getState().kwm;

    // Implement getStats according to https://www.w3.org/TR/webrtc-stats/#example-of-a-stats-application
    const promises = [];
    for (const id in connections) {
      const c = connections[id];
      if (c._pc) {
        try {
          const senders = c._pc.getSenders();
          const receivers = c._pc.getReceivers();
          senders.forEach(sender => {
            promises.push(sender.getStats());
          });
          receivers.forEach(receiver => {
            promises.push(receiver.getStats());
          });
        } catch (err) {
          console.warn('getStats failed', err); // eslint-disable-line no-console
        }
      }
    }

    if (promises.length === 0) {
      return null;
    }

    const result = {
      transportsBytesSend: 0,
      transportsBytesReceived: 0,
    };
    const reports = await Promise.all(promises);
    reports.forEach(report => {
      for (let record of report.values()) {
        //console.debug('getStats record', record.type, record.bytesSent, record.bytesReceived, record);
        switch (record.type) {
          case 'outbound-rtp':
            result.transportsBytesSend += record.bytesSent;
            break;
          case 'inbound-rtp':
            result.transportsBytesReceived += record.bytesReceived;
            break;
          case 'candidate-pair':
            break;
          default:
            continue;
        }

        if (!result.timestamp && record.timestamp) {
          // NOTE(longsleep): We use only a single timestamp, probably a little off ..
          result.timestamp = record.timestamp;
        }
      }
    });

    return result;
  };
}
