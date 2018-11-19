import kvs from '../kvs';
import {
  ADD_OR_UPDATE_RECENT,
  REMOVE_RECENT,
  SET_RECENTS,
} from './types';
import { maxRecentsCount } from '../reducers/recents';

const kvsCollection = 'kopano-meet-recents';
const globalIDPrefix = Math.random().toString(36).substring(7);

let globalIDCount = 0;

export function fetchRecents() {
  return (dispatch, getState) => {
    const { table, sorted } = getState().recents;

    return dispatch(kvs.get(`${kvsCollection}/`, 'user', { recurse: true })).then(async recents => {
      if (recents.length === 0 && sorted.length > 0) {
        // Import all the old shit if we have some and kvs is empty.
        const reversed = sorted.slice(0, maxRecentsCount);
        reversed.reverse();
        const importer = async () => {
          for (let i=0; i<reversed.length; i++) {
            const rid = reversed[i];
            const [ kind, ...idParts ] = rid.split('_');
            const id = idParts.join('_');
            await dispatch(kvs.createOrUpdate(`${kvsCollection}/${kind}/${id}`, table[rid], 'user')).catch(err => {
              console.warn('failed to sync recents entry', err);  // eslint-disable-line no-console
            });
          }
        };
        setTimeout(importer, 0);
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
          setTimeout(remover, 0);
        }
        await dispatch({
          type: SET_RECENTS,
          sorted,
          table,
        });
      }
    }).catch(err => {
      console.warn('failed to fetch recents entries', err); // eslint-disable-line no-console
    });
  };
}

const addOrUpdateRecentEntry = (id, kind, entry) => {
  return async (dispatch) => {
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

    await dispatch({
      type: ADD_OR_UPDATE_RECENT,
      rid,
      kind,
      entry,
      date,
      cleanup: async (superfluous) => {
        // Register a cleanup function which gets triggerd with all entries
        // which are removed from the store.
        for (let i=0; i<superfluous.length; i++) {
          const [ kind, ...idParts ] = superfluous[i].split('_');
          const id = idParts.join('_');
          await dispatch(kvs.del(`${kvsCollection}/${kind}/${id}`, 'user')).catch(err => {
            console.warn('failed to delete superfluous recents entry on update', err); //eslint-disable-line no-console
          });
        }
      },
    });
  };
};

export const removeRecentEntry = (rid) => {
  return async (dispatch) => {
    const [ kind, ...idParts ] = rid.split('_');
    const id = idParts.join('_');

    dispatch(kvs.del(`${kvsCollection}/${kind}/${id}`, 'user')).catch(err => {
      console.warn('failed to delete recents entry', err); //eslint-disable-line no-console
    });

    await dispatch({
      type: REMOVE_RECENT,
      rid,
    });
  };
};

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
    }));
  };
}
