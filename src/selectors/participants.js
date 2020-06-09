import { createSelector } from 'reselect';

import { mapContactEntryToUserShape } from '../utils';

// NOTE(longsleep): The guest name prefix is currently hardcoded in kwm server. Keep synced.
export const guestDisplayNamePrefixMatcher = new RegExp('^\\(Guest\\)');

const getStreams = (state) => state.streams;
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
    const participants = Object.keys(streams).map(id => {
      const contact = table[id];
      if (contact) {
        return mapContactEntryToUserShape(contact);
      }

      const user = streams[id].user;
      const guid = user.displayName + ',' + id;
      return {
        guid,
        id,
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
