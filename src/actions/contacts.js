import { fetchUsers } from '../api';
import {
  CONTACTS_FETCH,
  CONTACTS_ADD,
  CONTACTS_ERROR,
} from './types';

export function fetchContacts() {
  return (dispatch) => {
    dispatch(contactsFetch(true));

    return dispatch(fetchUsers()).then(contacts => {
      dispatch(contactsFetch(false));
      return contacts;
    }).catch(err => {
      dispatch(errorContacts(err));
      throw err;
    });
  };
}

export function fetchAndAddContacts() {
  return (dispatch) => {
    return dispatch(fetchContacts()).then(contacts => {
      return dispatch(addContacts(contacts.value));
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

export const errorContacts = (error) => ({
  type: CONTACTS_ERROR,
  error,
});
