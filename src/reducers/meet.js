import {
  KPOP_RECEIVE_USER,
} from 'kpop/es/oidc/constants';

import { scopeGuestOK } from 'kpop/es/oidc/scopes';
import { parseQuery } from 'kpop/es/utils';

import {
  MEET_MUTE_OR_UNMUTE,
  MEET_SET_MODE,
  MEET_LOCAL_STREAM,
} from '../actions/types';

import {
  requestUserMedia,
  muteStream,
  updateOfferAnswerConstraints,
} from '../actions/meet';
import { getCurrentAppPath } from '../base';

const defaultState = (() => {
  const hpr = parseQuery(window.location.hash.substr(1));

  const s = {
    guest: false,

    muteMic: false,
    muteCam: false,

    mode: 'standby',
    previousMode: null,

    localStream: null,
  };

  if (hpr.auto) {
    s.auto = {
      auto: hpr.auto,
      path: getCurrentAppPath(),
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

  return s;
})();

function meetReducer(state = defaultState, action) {
  switch (action.type) {
    case KPOP_RECEIVE_USER:
      return {
        ...state,
        guest: action.user && action.user.scope.indexOf(scopeGuestOK) >= 0,
      };

    case MEET_MUTE_OR_UNMUTE: {
      let { muteMic, muteCam } = action;
      muteMic = muteMic === state.muteMic ? undefined : muteMic;
      muteCam = muteCam === state.muteCam ? undefined : muteCam;

      if (muteMic === false || muteCam === false) {
        // TODO(longsleep): Only queue rum when it has failed before.
        action.queueDispatch(requestUserMedia());
      }

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
  }

  return state;
}

export default meetReducer;
