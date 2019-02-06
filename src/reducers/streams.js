import { forceBase64StdEncoded } from 'kpop/es/utils';

import {
  KWM_CALL_NEW,
  KWM_CALL_DESTROY,
  KWM_CALL_INCOMING,
  KWM_CALL_OUTGOING,
  KWM_PC_CONNECT,
  KWM_STREAM_RECEIVED,
  CONTACTS_UPDATE,
} from '../actions/types';

const defaultMediaStream = new MediaStream();

const defaultState = {
};

function streamsReducer(state = defaultState, action) {
  switch (action.type) {
    case KWM_CALL_NEW: {
      if (state[action.record.user]) {
        // We already know this user, do nothing.
        return state;
      }
      const entry = {
        id: action.record.user,
        stream: defaultMediaStream,
        user: action.user,
        calling: true,
      };
      return Object.assign({}, state, {
        [action.record.user]: entry,
      });
    }

    case KWM_CALL_INCOMING:
    case KWM_CALL_OUTGOING: {
      // Update display names from record, if any and current entry is empty.
      if (!action.record.profile) {
        return state;
      }
      const entry = state[action.record.user];
      if (!entry) {
        // We no nothing about this user, do nothing.
        return state;
      }
      if (entry.user && entry.user.displayName !== '') {
        // Already got a name.
        return state;
      }
      return Object.assign({}, state, {
        [action.record.user]: Object.assign({}, entry, {
          user: {displayName: action.record.profile ? action.record.profile.name : ''},
        }),
      });
    }

    case CONTACTS_UPDATE: {
      let update = false;
      const updates = action.contacts.reduce((map, contact) => {
        const id = forceBase64StdEncoded(contact.id); // Contact ids are base64 encoded.
        if (state[id]) {
          const entry = Object.assign({}, state[id], {
            user: {displayName: contact.displayName},
          });
          map[id] = entry;
          update = true;
        }
        return map;
      }, {});
      if (update) {
        return Object.assign({}, state, updates);
      } else {
        return state;
      }
    }

    case KWM_CALL_DESTROY: {
      const streams = Object.assign({}, state);
      delete streams[action.record.user];
      return streams;
    }

    case KWM_STREAM_RECEIVED: {
      const entry = Object.assign({}, state[action.record.user], {
        stream: action.stream,
        calling: false,
      });
      return Object.assign({}, state, {
        [action.record.user]: entry,
      });
    }

    case KWM_PC_CONNECT: {
      const entry = Object.assign({}, state[action.record.user], {
        calling: false,
      });
      return Object.assign({}, state, {
        [action.record.user]: entry,
      });
    }

    default:
      return state;
  }
}

export default streamsReducer;
