import { fetchUsers } from '../api';
import {
  ADD_CONTACTS,
} from './types';

export function fetchContacts() {
  return (dispatch) => {
    return dispatch(fetchUsers());
  };
}

export const addContacts = (contacts) => ({
  type: ADD_CONTACTS,
  contacts,
});
