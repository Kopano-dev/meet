import { push as pushRouterHistory, replace as replaceRouterHistory } from 'connected-react-router';
import { defineMessages } from 'react-intl';

import debounce from 'kpop/es/utils/debounce';
import { setError, enqueueSnackbar } from 'kpop/es/common/actions';
import { getUserManager } from 'kpop/es/oidc/usermanager';

import { resolveContactID } from '../utils';
import {
  MEET_MUTE_OR_UNMUTE,
  MEET_SET_MODE,
  MEET_LOCAL_STREAM,
  MEET_SET_GUEST,
  MEET_SET_AUTO,
  MEET_SET_COVER,
} from './types';
import {
  doAccept as kwmDoAccept,
  doHangup as kwmDoHangup,
  doReject as kwmDoReject,
  doIgnore as kwmDoIgnore,
  doCall as kwmDoCall,
  doGroup as kwmDoGroup,
  setLocalStream as kwmSetLocalStream,
  unsetLocalStream as kwmUnsetLocalStream,
  setScreenshareStream as kwmSetScreenshareStream,
  updateOfferAnswerConstraints as kwmUpdateOfferAnswerConstraints,
  applyLocalStreamTracks as kwmApplyLocalStreamTracks,
} from './kwm';
import {
  addOrUpdateRecentsFromGroup,
  addOrUpdateRecentsFromContact,
} from './recents';
import {
  globalSettings as mediaGlobalSettings,
  requestUserMedia as mediaRequestUserMedia,
  stopUserMedia as mediaStopUserMedia,
  requestDisplayMedia as mediaRequestDisplayMedia,
  stopDisplayMedia as mediaStopDisplayMedia,
  muteVideoStream as mediaMuteVideoStream,
  muteAudioStream as mediaMuteAudioStream,
} from './media';

const LOCAL_STREAM_ID = 'callview-main';
export const SCREENSHARE_SCREEN_ID = 'screen1'; // TODO(longsleep): Make this internal.

const translations = defineMessages({
  callCurrentlyNotActiveSnack: {
    id: 'callView.notActive.snack',
    defaultMessage: 'Guests can only join active group meetings.',
  },
  callNoAccessSnack: {
    id: 'callView.noAccess.snack',
    defaultMessage: 'You do not have access here.',
  },
  rdmFailed: {
    id: 'meet.errorMessage.rdmFailed.message',
    defaultMessage: 'Failed to share your screen!',
  },
  rumFailedCamera: {
    id: 'meet.errorMessage.rumFailedCamera.message',
    defaultMessage: 'Failed to access your camera!',
  },
  rumFailedMicrophone: {
    id: 'meet.errorMessage.rumFailedMicrophone.message',
    defaultMessage: 'Failed to access your microphone!',
  },
  rumFailedCameraAndMicrophone: {
    id: 'meet.errorMessage.rumFailedCameraMicrophone.message',
    defaultMessage: 'Failed to access your camera and microphone!',
  },
});

export function pushHistory(pathname, state, options={}) {
  return dispatch => {
    return dispatch(pushOrReplaceHistory(false, pathname, state, options, true));
  };
}

export function replaceHistory(pathname, state, options={}) {
  return dispatch => {
    return dispatch(pushOrReplaceHistory(true, pathname, state, options, true));
  };
}

export function pushOrReplaceHistory(replace, pathname, state, options={}) {
  return async (dispatch) => {
    const { location } = window;

    const params = {
      pathname,
      state,
      hash: location.hash,
      search: location.search,
      ...options,
    };
    await dispatch(replace ?
      replaceRouterHistory(params) :
      pushRouterHistory(params)
    );
  };
}

export function doViewGroup(group, { recents } = {}) {
  return dispatch => {
    if (recents) {
      dispatch(addOrUpdateRecentsFromGroup(group));
    }
    return dispatch(pushHistory(`/r/${group.scope}/${group.id}`));
  };
}

export function doViewContact(contact, { recents } = {}) {
  return dispatch => {
    if (recents) {
      dispatch(addOrUpdateRecentsFromContact(contact));
    }
    return dispatch(pushHistory(`/r/call/${contact.id}`, { entry: contact }));
  };
}

export function doAccept(id, mode, entry, kind) {
  return async (dispatch) => {
    await dispatch(wakeFromStandby(mode));

    if (entry) {
      switch (kind) {
        case 'contact':
          dispatch(doViewContact(entry));
          break;
      }
    }

    await dispatch(kwmDoAccept(id));
  };
}

export function doReject(id) {
  return (dispatch) => {
    return dispatch(kwmDoReject(id));
  };
}

export function doIgnore(id) {
  return (dispatch) => {
    return dispatch(kwmDoIgnore(id));
  };
}

export function doHangup() {
  return (dispatch) => {
    return dispatch(kwmDoHangup());
  };
}

const autoSupport = new class AutoSupport {
  triggered = null;

  doAutoCall = () => {
    return (dispatch, getState) => {
      const state = getState();
      const { auto } = state.meet;
      const { location } = state.router;
      const { connected } = state.kwm;

      if (connected && auto && this.triggered !== auto) {
        if (location.pathname.substr(1) === auto.path) {
          this.triggered = auto; // Trigger same auto only once.
          // Parse auto value.
          const mode = auto.auto === '1' ? 'call' : 'videocall';
          const path = auto.path.substr(2);
          let [ scope, ...id ] = path.split('/');
          if (scope === auto.prefix) {
            // Strip of prefx if any.
            [ scope, ...id ] = id;
          }
          // Trigger auto call, based on parsed data.
          switch (scope) {
            case 'conference':
            case 'group':
              dispatch(doCall({
                scope,
                id: id.join('/'),
              }, 'group', mode));
              break;
          }
        }
      }
    };
  }
}();
export const doAutoCall = autoSupport.doAutoCall;

export const setAuto = (auto) => ({
  type: MEET_SET_AUTO,
  auto,
});

export function doCall(entry, kind, mode) {
  return async dispatch => {
    switch (kind) {
      case 'group':
        dispatch(doViewGroup(entry));
        if (mode) {
          dispatch(doCallGroup(entry, mode));
        }
        break;

      default:
        // Default is contacts.
        dispatch(doViewContact(entry));
        if (mode) {
          dispatch(doCallContact(entry, mode));
        }
        break;
    }
  };
}

export function doCallContact(contact, mode) {
  return async (dispatch, getState) => {
    const {
      config,
    } = getState().common;

    dispatch(addOrUpdateRecentsFromContact(contact));

    await dispatch(wakeFromStandby(mode));

    await dispatch(kwmDoCall(resolveContactID(config, contact), () => {
      /* No error handling here is probably not good!? */
    }));
  };
}

export function doCallGroup(group, mode) {
  return async (dispatch) => {
    dispatch(addOrUpdateRecentsFromGroup(group));

    await dispatch(wakeFromStandby(mode));

    const { id, scope } = group;
    await dispatch(kwmDoGroup(`${scope}/${id}`, err => {
      switch (err.code) {
        case 'create_restricted':
          dispatch(enqueueSnackbar({
            message: translations.callCurrentlyNotActiveSnack,
            options: { variant: 'warning' },
          }));
          break;
        case 'access_restricted':
          dispatch(enqueueSnackbar({
            message: translations.callNoAccessSnack,
            options: { variant: 'warning' },
          }));
          break;
        default:
          /* What about the other errors? */
      }
    }));
  };
}

export function wakeFromStandby(newMode) {
  return (dispatch, getState) => {
    const state = getState();

    const {
      umAudioVideoStreams,

      muteCam,
    } = state.media;
    const {
      mode,
    } = state.meet;

    return new Promise(resolve => {
      // TODO(longsleep): What is going on here? Refact to make this clear.
      newMode = newMode ? newMode : (muteCam ? 'call' : 'videocall');
      if (newMode !== 'default' && mode !== newMode) {
        dispatch(kwmUnsetLocalStream())
          .then(() => dispatch(setMode(newMode)))
          .then(() => resolve());
      } else {
        Promise.resolve().then(resolve);
      }
    }).then(() => {
      const stream = umAudioVideoStreams[LOCAL_STREAM_ID];
      if (!stream || !stream.active) {
        dispatch(requestUserMedia(LOCAL_STREAM_ID));
      }
    });
  };
}

export function toggleStandby(standby) {
  return (dispatch, getState) => {
    const {
      mode,
      previousMode,
    } = getState().meet;

    if (standby && mode !== 'standby') {
      dispatch(setMode('standby'));
    } else if (!standby && mode === 'standby') {
      dispatch(setMode(previousMode ? previousMode : 'videocall'));
    }
  };
}

export const doMuteOrUnmute = ({muteMic, muteCam} = {}) => ({
  type: MEET_MUTE_OR_UNMUTE,
  muteMic,
  muteCam,
});

export const setMode = (mode) => ({
  type: MEET_SET_MODE,
  mode,
});

const displayMedia = new class DisplayMedia {
  constructor() {
    this.rdms = new Map();
    this.failed = new Map();
  }

  getSettings = (/*state*/) => {
    return {
      // TODO(longsleep): Add settins from store.
    };
  }

  stopDisplayMedia = (id=LOCAL_STREAM_ID) => {
    return async (dispatch) => {
      if (this.rdms.has(id)) {
        this.rdms.get(id).cancel();
        this.rdms.delete(id);
      }

      await dispatch(mediaStopDisplayMedia(id));
    };
  }

  requestDisplayMedia = (id=LOCAL_STREAM_ID, screen=SCREENSHARE_SCREEN_ID) => {
    return async (dispatch, getState) => {
      const state = getState();

      if (this.rdms.has(id)) {
        this.rdms.get(id).cancel();
        this.rdms.delete(id);
      }
      this.failed.delete(id);

      // Request display media with reference to allow cancel.
      const rdm = debounce(() => {
        return dispatch(mediaRequestDisplayMedia(id, this.getSettings(state)));
      }, 500)(id);
      this.rdms.set(id, rdm);

      // Response actions.
      return rdm.catch(err => {
        this.failed.set(id, true); // Mark error.
        dispatch(setError({
          detail: `${err}`,
          message: translations.rdmFailed,
          fatal: false,
        }));
        return null;
      }).then(info => {
        this.failed.delete(id);
        if (info && info.stream) {
          return info.stream;
        }
        return null;
      }).then(async stream => {
        console.debug('requestDisplayMedia stream', id, screen, stream); // eslint-disable-line no-console
        if (stream) {
          const tracks = stream.getVideoTracks();
          if (tracks.length > 0) {
            // Register event to clean up the stream when the first video track
            // has ended.
            tracks[0].onended = (event) => {
              event.target.onended = undefined;
              // TODO(longsleep): This might not detect that the stream is old.
              dispatch(setScreenshareStreamWithStream(screen, null)).catch(err => {
                console.warn('failed to set/clear ended screen share stream', err); // eslint-disable-line no-console
              }); // clears.
            };
          } else {
            console.warn('requestDisplayMedia stream got stream with no video tracks', id, screen, stream); // eslint-disable-line no-console
            return null;
          }
        }
        return stream;
      }).then(async stream => {
        await dispatch(setScreenshareStreamWithStream(screen, stream));
        return stream;
      });
    };
  }
}();
export const requestDisplayMedia = displayMedia.requestDisplayMedia;
export const stopDisplayMedia = displayMedia.stopDisplayMedia;

function setScreenshareStreamWithStream(screen, stream) {
  return (dispatch) => {
    if (stream) {
      return dispatch(kwmSetScreenshareStream(screen, stream));
    } else {
      return dispatch(kwmSetScreenshareStream(screen, null));
    }
  };
}

const userMedia = new class UserMedia {
  constructor() {
    this.rums = new Map();
    this.failed = new Map();
  }

  getSettings = state => {
    const {
      videoSourceId,
      audioSourceId,
      settings,
    } = state.media;

    return {
      videoSourceId,
      audioSourceId,
      ...settings,
    };
  }

  stopUserMedia = (id=LOCAL_STREAM_ID) => {
    return async (dispatch) => {
      if (this.rums.has(id)) {
        this.rums.get(id).cancel();
        this.rums.delete(id);
      }

      await dispatch(mediaStopUserMedia(id));
    };
  }

  requestUserMedia = (id=LOCAL_STREAM_ID) => {
    return async (dispatch, getState) => {
      const state = getState();

      const {
        umAudioVideoStreams,
      } = state.media;

      const {
        mode,
        muteMic,
        muteCam,
      } = state.meet;

      if (this.rums.has(id)) {
        this.rums.get(id).cancel();
        this.rums.delete(id);
      }
      this.failed.delete(id); // Clear error state.

      let video = false;
      let audio = false;
      switch (mode) {
        case 'videocall':
          video = true; // eslint-disable-line no-fallthrough
        case 'call':
          audio = true;
          break;
        case 'standby':
          audio = false;
          video = false;
          break;
        default:
          throw new Error(`unknown mode: ${mode}`);
      }

      if (mediaGlobalSettings.muteWithAddRemoveTracks) {
        video = video && !muteCam;
        audio = audio && !muteMic;
      }

      // Request user media with reference to allow cancel.
      const rum = debounce((id, v, a) => {
        if (!v && !a) {
          const stream = umAudioVideoStreams[id];
          if (stream) {
            for (const track of stream.getTracks()) {
              track.onended = undefined;
            }
          }
        }

        return dispatch(mediaRequestUserMedia(id, v, a, this.getSettings(state)));
      }, 500)(id, video, audio);
      this.rums.set(id, rum);

      // Response actions.
      return rum.catch(err => {
        let message;
        if (video && audio) {
          message = translations.rumFailedCameraAndMicrophone;
        } else if (video) {
          message = translations.rumFailedCamera;
        } else if (audio) {
          message = translations.rumFailedMicrophone;
        }
        this.failed.set(id, true); // Mark error.
        dispatch(setError({
          detail: `${err}`,
          message,
          fatal: false,
        }));
        dispatch(doMuteOrUnmute({
          muteCam: video ? true : undefined,
          muteMic: audio ? true : undefined,
        }));
        return null;
      }).then(info => {
        this.failed.delete(id);
        if (info && info.stream) {
          const videoTracks = info.stream.getVideoTracks();
          const audioTracks = info.stream.getAudioTracks();
          const mute = {};
          if (video && videoTracks.length === 0) {
            mute.muteCam = true;
          }
          if (videoTracks.length > 0) {
            videoTracks[0].onended = (event) => {
              event.target.onended = undefined;
              dispatch(mediaMuteVideoStream(info.stream));
              dispatch(doMuteOrUnmute({
                muteCam: true,
              }));
            };
          }
          if (audio && audioTracks.length === 0) {
            mute.muteMic = true;
          }
          if (audioTracks.length > 0) {
            audioTracks[0].onended = (event) => {
              event.target.onended = undefined;
              dispatch(mediaMuteAudioStream(info.stream));
              dispatch(doMuteOrUnmute({
                muteMic: true,
              }));
            };
          }
          dispatch(doMuteOrUnmute(mute));
          const promises = [];
          if (muteCam || !video) {
            promises.push(dispatch(mediaMuteVideoStream(info.stream)));
          }
          if (muteMic || !audio) {
            promises.push(dispatch(mediaMuteAudioStream(info.stream)));
          }
          return Promise.all(promises).then(() => {
            return info.stream;
          });
        } else {
          const mute = {};
          if (video) {
            mute.muteCam = true;
          }
          if (audio) {
            mute.muteMic = true;
          }
          dispatch(doMuteOrUnmute(mute));
        }
        return null;
      }).then(async stream => {
        await dispatch(setLocalStreamWithStream(stream));
        return stream;
      });
    };
  }
}();
export const requestUserMedia = userMedia.requestUserMedia;
export const stopUserMedia = userMedia.stopUserMedia;

function setLocalStreamWithStream(stream) {
  return (dispatch) => {
    if (stream) {
      dispatch(kwmSetLocalStream(stream));
    } else {
      dispatch(kwmUnsetLocalStream());
    }
    return dispatch({
      type: MEET_LOCAL_STREAM,
      stream,
    });
  };
}

export function setLocalStream() {
  return (dispatch, getState) => {
    const {
      umAudioVideoStreams,
    } = getState().media;

    const stream = umAudioVideoStreams[LOCAL_STREAM_ID];
    return dispatch(setLocalStreamWithStream(stream));
  };
}

export function updateOfferAnswerConstraints() {
  return (dispatch, getState) => {
    const { mode } = getState().meet;

    // TODO(longsleep): Remove useless condition.
    if (mode === 'videocall') {
      dispatch(kwmUpdateOfferAnswerConstraints({
      }));
    } else {
      dispatch(kwmUpdateOfferAnswerConstraints({
      }));
    }
  };
}

export function muteStream({mute, video, audio}) {
  return (dispatch, getState) => {
    const state = getState();

    const {
      umAudioVideoStreams,
    } = state.media;
    mute = mute === undefined ? true : mute;

    const stream = umAudioVideoStreams[LOCAL_STREAM_ID];
    if (!stream) {
      // Do nothing without a stream.
      return Promise.resolve();
    }

    for (const track of stream.getVideoTracks()) {
      if (video && track.kind === 'video') {
        track.onended = undefined;
      }
      if (audio && track.kind === 'audio') {
        track.onended = undefined;
      }
    }

    const settings = userMedia.getSettings(state);
    const actions = [];
    if (video) {
      actions.push(mediaMuteVideoStream);
    }
    if (audio) {
      actions.push(mediaMuteAudioStream);
    }
    const promises = [];
    actions.map(action => {
      promises.push(dispatch(action(stream, mute, LOCAL_STREAM_ID, settings)).then(info => {
        const videoTracks = info.stream.getVideoTracks();
        const audioTracks = info.stream.getAudioTracks();
        const mute = {};
        if (video) {
          mute.muteCam = videoTracks.length === 0;
          if (info.newStream && !mute) {
            mute.muteMic = audioTracks.length === 0;
          }
          if (videoTracks.length > 0) {
            videoTracks[0].onended = (event) => {
              event.target.onended = undefined;
              dispatch(mediaMuteVideoStream(info.stream));
              dispatch(doMuteOrUnmute({
                muteCam: true,
              }));
            };
          }
        }
        if (audio) {
          mute.muteMic = audioTracks.length === 0;
          if (info.newStream && !mute) {
            mute.muteCam = videoTracks.length === 0;
          }
          if (audioTracks.length > 0) {
            audioTracks[0].onended = (event) => {
              event.target.onended = undefined;
              dispatch(mediaMuteAudioStream(info.stream));
              dispatch(doMuteOrUnmute({
                muteMic: true,
              }));
            };
          }
        }
        dispatch(doMuteOrUnmute(mute));
        if (info.newStream) {
          dispatch(setLocalStreamWithStream(info.newStream));
        } else {
          dispatch(kwmApplyLocalStreamTracks(info));
        }
      }).catch(err => {
        console.warn('failed to toggle mute for video stream', err); // eslint-disable-line no-console
        let message;
        if (video && audio) {
          message = translations.rumFailedCameraAndMicrophone;
        } else if (video) {
          message = translations.rumFailedCamera;
        } else if (audio) {
          message = translations.rumFailedMicrophone;
        }
        dispatch(setError({
          detail: `${err}`,
          message,
          fatal: false,
        }));
        dispatch(doMuteOrUnmute({
          muteCam: video ? true : undefined,
          muteMic: audio ? true : undefined,
        }));
      }));
    });
    return Promise.all(promises);
  };
}

export const setGuest = (guest) => ({
  type: MEET_SET_GUEST,
  guest,
});

export const setCover = (cover=true) => ({
  type: MEET_SET_COVER,
  cover: !!cover,
});

export function disableSessionMonitorWhenGuest() {
  return (dispatch, getState) => {
    const { guest } = getState().meet;
    if (guest.guest && guest.user) {
      const um = getUserManager();
      // TODO(longsleep): Use a kpop function to disable the session monitor
      // for guests once one is implemented.
      if (um && um.usermanager._sessionMonitor) {
        um.usermanager._sessionMonitor._stop();
      }
    }
  };
}
