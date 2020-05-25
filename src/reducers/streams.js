import { forceBase64StdEncoded } from 'kpop/es/utils';

import {
  KWM_CALL_NEW,
  KWM_CALL_DESTROY,
  KWM_CALL_INCOMING,
  KWM_CALL_OUTGOING,
  KWM_PC_CONNECT,
  KWM_STREAMS_ANNOUNCE,
  KWM_STREAM_RECEIVED,
  CONTACTS_UPDATE,
} from '../actions/types';

const defaultMediaStream = new MediaStream();
const defaultStreamKey = 'stream';

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
        [defaultStreamKey]: defaultMediaStream,
        user: action.user,
        announces: {},
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

    case KWM_STREAMS_ANNOUNCE: {
      const entry = Object.assign({}, state[action.record.user]);
      const announces = Object.assign({}, entry.announces);
      for (let removed of action.removed) {
        delete announces[removed.token];
        const streamKey = `stream_${removed.kind}_${removed.id}`;
        delete entry[streamKey];
      }
      for (let added of action.added) {
        announces[added.token] = added;
      }
      entry.announces = announces;
      return Object.assign({}, state, {
        [action.record.user]: entry,
      });
    }

    case KWM_STREAM_RECEIVED: {
      if (action.record.cid) {
        // Do nothing here for records which have cid set (they are special, for example used with mcu.
        return state;
      }

      const entry = state[action.record.user];

      let streamKey = defaultStreamKey;
      if (action.token) {
        // Use token to lookup previously announced stream.
        const announce = entry.announces[action.token];
        if (!announce) {
          // Unknown token, ignore.
          return state;
        }
        streamKey = `stream_${announce.kind}_${announce.id}`;
      }

      if (entry && entry[streamKey] === action.stream) {
        // Stream unchanged, do nothing.
        return state;
      }
      return Object.assign({}, state, {
        [action.record.user]: {
          ...entry,
          [streamKey]: action.stream,
          calling: streamKey === defaultStreamKey ? false : entry.calling,
        },
      });
    }

    case KWM_PC_CONNECT: {
      if (action.record.cid || action.record.cid === undefined) {
        // Do nothing here for records which have cid set (they are special, for example used with mcu.
        // Do nothing here for records which have undefined cid (like p2p records).
        return state;
      }
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
