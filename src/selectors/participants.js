import { createSelector } from 'reselect';

import { mapContactEntryToUserShape } from '../utils';

import { getStreams } from './streams';

// NOTE(longsleep): The guest name prefix is currently hardcoded in kwm server. Keep synced.
export const guestDisplayNamePrefixMatcher = new RegExp('^\\(Guest\\)');

const getContactsTable = (state) => state.contacts.table;
const getProfile = (state) => state.common.profile;
const getMuteMic = (state) => state.meet.muteMic;
const getMuteCam = (state) => state.meet.muteCam;
const getLocalStreamTalking = (state) => state.meet.localStreamTalking;

const sortable = (a) => {
  const displayName = a.displayName ? a.displayName.replace(guestDisplayNamePrefixMatcher, '') : '';
  return `${displayName} ${a.givenName} ${a.surname}zzz,${a.userPrincipalName}`.trim().toLowerCase();
};

const sorter = (a, b) => {
  const as = sortable(a);
  const bs = sortable(b);

  return as.localeCompare(bs);
};

export const getCurrentParticipants = createSelector(
  [ getStreams, getContactsTable, getProfile, getMuteMic, getMuteCam, getLocalStreamTalking ],
  (streams, table, profile, muteMic, muteCam, localStreamTalking) => {
    const participants = Object.entries(streams).map(([id, stream]) => {

      const props = {
        calling: stream.calling,
        audio: stream.audio,
        video: stream.video,
        talking: stream.talking,
      };
      const contact = table[id];
      if (contact) {
        return {
          ...props,
          ...mapContactEntryToUserShape(contact),
        };
      }

      const user = stream.user;
      const guid = user.displayName + ',' + id;
      return {
        guid,
        id,
        ...props,
        ...user,
      };
    });
    participants.push({
      ...profile,
      isSelf: true,
      id: profile.guid,
      audio: !muteMic,
      video: !muteCam,
      talking: localStreamTalking,
    });
    participants.sort(sorter);

    return participants;
  }
);
