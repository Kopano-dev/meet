import { createSelector } from 'reselect';

import { mapContactEntryToUserShape } from '../utils';

import { getStreams } from './streams';

// NOTE(longsleep): The guest name prefix is currently hardcoded in kwm server. Keep synced.
export const guestDisplayNamePrefixMatcher = new RegExp('^\\(Guest\\)');

const getContactsTable = (state) => state.contacts.table;
const getProfile = (state) => state.common.profile;

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
  [ getStreams, getContactsTable, getProfile ],
  (streams, table, profile) => {
    const participants = Object.entries(streams).map(([id, stream]) => {

      const contact = table[id];
      if (contact) {
        return {
          calling: stream.calling,
          ...mapContactEntryToUserShape(contact),
        };
      }

      const user = stream.user;
      const guid = user.displayName + ',' + id;
      return {
        guid,
        id,
        calling: stream.calling,
        ...user,
      };
    });
    participants.push({
      ...profile,
      isSelf: true,
      id: profile.guid,
    });
    participants.sort(sorter);

    return participants;
  }
);
