import {
  ADD_OR_UPDATE_RECENT,
} from './types';

const addOrUpdateRecentEntry = (id, kind, entry) => ({
  type: ADD_OR_UPDATE_RECENT,
  id,
  kind,
  entry,
  date: new Date(),
});

export function addOrUpdateRecentsFromContact(id) {
  return (dispatch, getState) => {
    const { table } = getState().contacts;

    let contact = table[id];
    if (!contact) {
      // No contact for id - well we cannot do much but at least use id.
      contact = {
        id,
      };
    }

    return dispatch(addOrUpdateRecentEntry(id, 'contact', contact));
  };
}

export function addOrUpdateRecentsFromGroup(id, scope) {
  return (dispatch) => {
    return dispatch(addOrUpdateRecentEntry(id, 'group', {
      id,
      scope,
      displayName: id,
      jobTitle: scope,
    }));
  };
}
