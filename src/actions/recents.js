import { requireScope } from 'kpop/es/utils/permissions';
import { scopeKvs } from 'kpop/es/oidc/scopes';
import { enqueueErrorSnackbar } from 'kpop/es/common/actions';

import kvs from '../api/kvs';
import {
  RECENTS_ADD_OR_UPDATE,
  RECENTS_REMOVE,
  RECENTS_SET,
  RECENTS_CLAIM,
  RECENTS_FETCH,
  RECENTS_ERROR,
} from './types';
import { maxRecentsCount } from '../reducers/recents';
import { getContactID } from '../reducers/contacts';

const kvsCollection = 'kopano-meet-recents';
const globalIDPrefix = Math.random().toString(36).substring(7);

let globalIDCount = 0;

export function fetchRecents() {
  return requireScope(scopeKvs, (dispatch, getState) => {
    dispatch(recentsFetch(true));

    const { table, sorted, guid } = getState().recents;
    const { profile } = getState().common;

    return dispatch(kvs.get(kvsCollection, 'user', { recurse: true })).then(async recents => {
      dispatch(recentsFetch(false));
      if (recents.length === 0 && sorted.length > 0) {
        if (guid === undefined || guid === profile.guid) {
          // Import all the old shit if we have some and kvs is empty.
          const reversed = sorted.slice(0, maxRecentsCount);
          reversed.reverse();
          const importer = async () => {
            const entries = [];
            // Batch mode import to kvs.
            for (let i=0; i<reversed.length; i++) {
              const rid = reversed[i];
              const [ kind, ...idParts ] = rid.split('_');
              const id = idParts.join('_');
              entries.push({
                key: `${kind}/${id}`,
                value: table[rid],
                content_type: 'application/json', // eslint-disable-line camelcase
              });
            }
            await dispatch(kvs.createOrUpdate(`${kvsCollection}`, entries, 'user', { batch: true })).catch(err => {
              console.warn('failed to sync recents entry to server', err);  // eslint-disable-line no-console
            });
          };
          Promise.resolve().then(importer);
          await dispatch(recentsClaim(guid));
        }
      } else {
        // Import recents as loaded.
        const sorted = [];
        const superfluous = [];
        const table = {};
        let count = 0;
        recents = recents.reverse(); // Reverse so limit can get rid of older entries.

        for (let i=0; i<recents.length; i++) {
          const entry = recents[i];
          count++;
          if (count > maxRecentsCount) {
            // Mark for removal.
            superfluous.push(entry.key);
            continue;
          }
          const [ collection, kind, ...idParts ] = entry.key.split('/'); // eslint-disable-line no-unused-vars
          const id = idParts.join('/');
          const rid = `${kind}_${id}`;
          // Add in order, since we already reversed.
          sorted.push(rid);
          table[rid] = entry.value;
        }
        if (superfluous.length > 0) {
          // Remove all entries which exceed our expected limit.
          const remover = async () => {
            for (let i=0; i<superfluous.length; i++) {
              await dispatch(kvs.del(superfluous[i], 'user')).catch(err => {
                console.warn('failed to delete superfluous recents entry', err); //eslint-disable-line no-console
              });
            }
          };
          Promise.resolve().then(remover);
        }
        await dispatch(recentsSet(sorted, table, profile.guid));
      }
    }).catch(err => {
      dispatch(errorRecents(err));
      throw err;
    });
  }, null);
}

const addOrUpdateRecentEntry = (id, kind, entry) => {
  return requireScope(scopeKvs, async (dispatch) => {
    if (!id) {
      kind = 'local';
      id = `${globalIDPrefix}-${++globalIDCount}`;
    }
    const rid = `${kind}_${id}`;

    const date = new Date();
    dispatch(kvs.createOrUpdate(`${kvsCollection}/${kind}/${id}`, {
      ...entry,
      date,
      kind,
    }, 'user')).catch(err => {
      console.warn('failed to create or update recents entry', err); // eslint-disable-line no-console
    });

    await dispatch(recentsAddOrUpdate(rid, kind, entry, date, async (superfluous) => {
      // Register a cleanup function which gets triggerd with all entries
      // which are removed from the store.
      for (let i=0; i<superfluous.length; i++) {
        const [ kind, ...idParts ] = superfluous[i].split('_');
        const id = idParts.join('_');
        await dispatch(kvs.del(`${kvsCollection}/${kind}/${id}`, 'user')).catch(err => {
          console.warn('failed to delete superfluous recents entry on update', err); //eslint-disable-line no-console
        });
      }
    }));
  }, null);
};

export const removeRecentEntry = (rid) => {
  return requireScope(scopeKvs, async (dispatch) => {
    const [ kind, ...idParts ] = rid.split('_');
    const id = idParts.join('_');

    dispatch(kvs.del(`${kvsCollection}/${kind}/${id}`, 'user')).catch(err => {
      console.warn('failed to delete recents entry', err); //eslint-disable-line no-console
    });

    await dispatch(recentsRemove(rid));
  }, null);
};

export function addOrUpdateRecentsFromContact(contact) {
  return async (dispatch, getState) => {
    if (!contact || !contact.id) {
      return;
    }

    // Get current contact entry if any to ensure to use up to date data.
    const { table } = getState().contacts;
    const id = getContactID(contact);
    const currentContact = table[id];
    if (currentContact) {
      contact = currentContact;
    }

    await dispatch(addOrUpdateRecentEntry(id, 'contact', contact));
  };
}

export function addOrUpdateRecentsFromGroup(group) {
  return async dispatch => {
    const { id } = group;

    await dispatch(addOrUpdateRecentEntry(id, 'group', {
      displayName: id,
      ...group,
    }));
  };
}

export const recentsSet = (sorted, table, guid) => ({
  type: RECENTS_SET,
  sorted,
  table,
  guid,
});

export const recentsClaim = (guid) => ({
  type: RECENTS_CLAIM,
  guid,
});

export const recentsAddOrUpdate = (rid, kind, entry, date, cleanup) => ({
  type: RECENTS_ADD_OR_UPDATE,
  rid,
  kind,
  entry,
  date,
  cleanup,
});

export const recentsRemove = (rid) => ({
  type: RECENTS_REMOVE,
  rid,
});

export const recentsFetch = (loading=true) => ({
  type: RECENTS_FETCH,
  loading,
});

export const errorRecents = (error) => {
  return dispatch => {
    dispatch(enqueueErrorSnackbar({
      message: 'Failed to fetch contacts: ' + error.message,
    }));
    return dispatch({
      type: RECENTS_ERROR,
      error,
    });
  };
};
