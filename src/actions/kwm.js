import { setError } from 'kpop/es/common/actions';

import * as KWM from 'kwmjs';

import * as types from './types';

console.info(`Kopano KWM js version: ${KWM.version}`); // eslint-disable-line no-console

// Reference to the active KWM.
let kwm = null;

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

    KWM.KWMInit.init({}); // Set default options.
    const k = new KWM(config.kwm.url, options);

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
        default:
          console.warn('KWM unknown peer event', event.event, event); // eslint-disable-line no-console
          break;
      }

      if (event.target.peers.size === 0 && event.target.channel !== '') {
        console.log('KWM hangup as no peers are left'); // eslint-disable-line no-console
        dispatch(doHangup());
      }
    };
    k.webrtc.onstream = event => {
      if (event.target.kwm !== kwm) {
        return;
      }

      dispatch(streamReceived(event));
    };

    return k;
  };
}

function error(event) {
  console.warn('KWM error event', event); // eslint-disable-line no-console

  return async (dispatch) => {
    let fatal = true;
    switch (event.code) {
      case 'no_session_for_user':
        fatal = false;
        break;
      default:
    }

    // TODO(longsleep): Make only fatal if kwm is not reconnecting.
    const error = {
      message: `Error: KWM error - ${event.msg} (${event.code})`,
      fatal: fatal,
    };

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
  const { record, stream } = event;

  return {
    type: types.KWM_STREAM_RECEIVED,
    record,
    stream,
  };
}

export function doCall(id) {
  return dispatch => {
    return kwm.webrtc.doCall(id).then(channel => {
      console.info('KWM channel create', channel); // eslint-disable-line no-console
      dispatch(channelChanged(channel));
      return channel;
    });
  };
}

export function doHangup() {
  return dispatch => {
    // Hangs up all and everyone.
    return kwm.webrtc.doHangup().then(channel => {
      console.info('KWM channel release', channel); // eslint-disable-line no-console
      dispatch(channelChanged(null));
    });
  };
}

export function doAccept(id) {
  return dispatch => {
    return kwm.webrtc.doAnswer(id).then(channel => {
      console.info('KWM channel create', channel); // eslint-disable-line no-console
      dispatch(channelChanged(channel));
      return channel;
    });
  };
}

export function doReject(id, reason='reject') {
  return () => {
    return kwm.webrtc.doHangup(id, reason);
  };
}

export function setLocalStream(stream) {
  return () => {
    console.info('KWM setting local stream', stream); // eslint-disable-line no-console
    kwm.webrtc.setLocalStream(stream);
  };
}

export function unsetLocalStream() {
  return () => {
    console.info('KWM unsetting local stream'); // eslint-disable-line no-console
    if (kwm) {
      kwm.webrtc.setLocalStream(); // clears.
    }
  };
}
