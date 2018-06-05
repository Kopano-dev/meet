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

    const contact = table[id];

    return dispatch(addOrUpdateRecentEntry(id, 'contact', contact));
  };
}
