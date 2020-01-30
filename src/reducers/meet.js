import {
  KPOP_RECEIVE_USER,
} from 'kpop/es/oidc/constants';

import { scopeGuestOK } from 'kpop/es/oidc/scopes';
import { parseQuery } from 'kpop/es/utils';

import {
  MEET_MUTE_OR_UNMUTE,
  MEET_SET_MODE,
  MEET_LOCAL_STREAM,
  MEET_SET_GUEST,
  MEET_SET_AUTO,
  MEET_SET_COVER,
} from '../actions/types';

import {
  requestUserMedia,
  muteStream,
  updateOfferAnswerConstraints,
  disableSessionMonitorWhenGuest,
} from '../actions/meet';
import { getCurrentAppPath } from '../base';

const defaultState = (() => {
  const hpr = parseQuery(window.location.hash.substr(1));
  const path = getCurrentAppPath();

  const s = {
    muteMic: false,
    muteCam: false,

    mode: 'standby',
    previousMode: null,

    cover: true,
    muted: true,

    localStream: null,

    guest: {
      guest: null,
      user: false,
    },
  };

  if (hpr.auto) {
    s.auto = {
      auto: hpr.auto,
      path,
    };
  }

  if (hpr.mute) {
    if (hpr.mute & 1) {
      s.muteMic = true;
    }
    if (hpr.mute & 2) {
      s.muteCam = true;
    }
  }

  if (hpr.guest) {
    s.guest.guest = hpr.guest;
    s.guest.path = decodeURI(path).substr(2);
    if (hpr.token) {
      s.guest.token = hpr.token;
    }
    if (hpr.name) {
      s.guest.name = hpr.name;
    }
  }

  return s;
})();

function meetReducer(state = defaultState, action) {
  switch (action.type) {
    case KPOP_RECEIVE_USER:
      action.queueDispatch(disableSessionMonitorWhenGuest());
      return {
        ...state,
        guest: {
          ...state.guest,
          user: action.user && action.user.scope.indexOf(scopeGuestOK) >= 0,
        },
      };

    case MEET_MUTE_OR_UNMUTE: {
      let { muteMic, muteCam, muteAudio } = action;
      muteMic = muteMic === state.muteMic ? undefined : muteMic;
      muteCam = muteCam === state.muteCam ? undefined : muteCam;
      muteAudio = muteAudio === state.mute ? undefined : muteAudio;

      if (muteMic !== undefined || muteCam !== undefined) {
        if (muteMic !== undefined) {
          action.queueDispatch(muteStream({
            mute: muteMic ? muteMic : state.mode === 'standby',
            audio: true,
          }));
        }
        if (muteCam !== undefined) {
          action.queueDispatch(muteStream({
            mute: muteCam ? muteCam : state.mode === 'standby',
            video: true,
          }));
        }
        return {
          ...state,
          muteMic: muteMic !== undefined ? muteMic : state.muteMic,
          muteCam: muteCam !== undefined ? muteCam : state.muteCam,
        };
      } else if (muteAudio !== undefined) {
        return {
          ...state,
          muted: muteAudio,
        };
      }
      break;
    }

    case MEET_SET_MODE:
      if (action.mode !== state.mode) {
        action.queueDispatch(updateOfferAnswerConstraints());
        action.queueDispatch(requestUserMedia());

        return {
          ...state,
          previousMode: state.mode,
          mode: action.mode,
        };
      }
      break;

    case MEET_LOCAL_STREAM:
      if (action.stream !== state.localStream) {
        return {
          ...state,
          localStream: action.stream,
        };
      }
      break;

    case MEET_SET_GUEST:
      return {
        ...state,
        guest: {
          ...state.guest,
          ...action.guest,
          user: state.guest.user,
        },
      };

    case MEET_SET_AUTO:
      return {
        ...state,
        auto: action.auto ? {
          ...state.auto,
          ...action.auto,
        } : undefined,
      };

    case MEET_SET_COVER:
      return {
        ...state,
        cover: action.cover,
      };
  }

  return state;
}

export default meetReducer;
