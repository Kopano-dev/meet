import { requireScope } from 'kpop/es/utils/permissions';
import { scopeGrapi } from 'kpop/es/oidc/scopes';

import { fetchUsers, fetchUser, fetchUsersWithParams, contactsLocalFetchLimit } from '../api/grapi';
import {
  CONTACTS_FETCH,
  CONTACTS_ADD,
  CONTACTS_UPDATE,
  CONTACTS_ERROR,
} from './types';

export function fetchContacts() {
  return requireScope(scopeGrapi, dispatch => {
    dispatch(contactsFetch(true));

    return dispatch(fetchUsers()).then(contacts => {
      dispatch(contactsFetch(false));
      return contacts;
    }).catch(err => {
      dispatch(errorContacts(err));
      throw err;
    });
  }, null);
}

export function fetchContactByID(id) {
  return requireScope(scopeGrapi, dispatch => {
    return dispatch(fetchUser(id));
  }, null);
}

export function fetchAndUpdateContactByID(id, initialize=false) {
  return (dispatch) => {
    return dispatch(fetchContactByID(id)).then(async contact => {
      if (contact !== null) {
        await dispatch(updateContacts([contact], initialize));
      }
      return contact;
    });
  };
}

export function fetchAndAddContacts() {
  return (dispatch) => {
    return dispatch(fetchContacts()).then(async contacts => {
      if (contacts !== null) {
        await dispatch(addContacts(contacts.value));
        return contacts.value;
      }
      return null;
    });
  };
}

export function initializeContactsWithRecents() {
  return (dispatch, getState) => {
    const { table } = getState().recents;

    const contacts = [];
    Object.values(table).forEach(entry=> {
      if (entry.kind === 'contact' && entry.displayName) {
        contacts.push({...entry});
      }
    });
    dispatch(updateContacts(contacts, true));
  };
}

export function searchContacts(term, top) {
  return (dispatch) => {
    dispatch(contactsFetch(true));
    top = top ? top : contactsLocalFetchLimit;

    return dispatch(fetchUsersWithParams({top, search: term})).then(contacts => {
      dispatch(contactsFetch(false));
      const value = contacts.value.slice(0, top); // NOTE(longsleep): Enforce local limit, in case server returns more.
      dispatch(updateContacts(value));
      return value;
    }).catch(err => {
      dispatch(errorContacts(err));
      throw err;
    });
  };
}

export const contactsFetch = (loading=true) => ({
  type: CONTACTS_FETCH,
  loading,
});

export const addContacts = (contacts) => ({
  type: CONTACTS_ADD,
  contacts,
});

export const updateContacts = (contacts, initialize=false) => ({
  type: CONTACTS_UPDATE,
  contacts,
  initialize,
});

export const errorContacts = (error) => ({
  type: CONTACTS_ERROR,
  error,
});
