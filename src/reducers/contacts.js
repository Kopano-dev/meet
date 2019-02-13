import {
  KPOP_RECEIVE_CONFIG,
} from 'kpop/es/config/constants';

import {
  CONTACTS_FETCH,
  CONTACTS_ADD,
  CONTACTS_UPDATE,
  CONTACTS_ERROR,
} from '../actions/types';

const defaultState = {
  sorted: [],
  table: {},
  remote: true,
  loading: true,
  error: null,
};

const contactsConfig = {
  useUserPrincipalName: false,
};

const sortable = (a) => {
  return `${a.displayName} ${a.givenName} ${a.surname}zzz,${a.userPrincipalName}`.trim().toLowerCase();
};

const sorter = (a, b) => {
  const as = sortable(a);
  const bs = sortable(b);

  return as.localeCompare(bs);
};

export const getContactID = (contact) => {
  if (contactsConfig.useUserPrincipalName) {
    return contact.userPrincipalName;
  }
  return contact.id;
};

function contactsReducer(state = defaultState, action) {
  switch (action.type) {
    case KPOP_RECEIVE_CONFIG:
      if (action.config && action.config.useIdentifiedUser) {
        // Meet is using the identified users user name. Switch over contacts
        // to use its equivalent value for lookup.
        contactsConfig.useUserPrincipalName = true;
      }
      return state;

    case CONTACTS_FETCH:
      return Object.assign({}, state, {
        loading: action.loading,
        error: false,
      });

    case CONTACTS_ADD: {
      const sorted = [...action.contacts];
      sorted.sort(sorter);
      const table = sorted.reduce((map, contact) => {
        map[getContactID(contact)] = contact;
        return map;
      }, {});

      return Object.assign({}, state, {
        sorted,
        table,
        remote: false, // Set remote to false if we have local contacts added.
      });
    }

    case CONTACTS_UPDATE: {
      const updates = action.contacts.reduce((map, contact) => {
        map[getContactID(contact)] = contact;
        return map;
      }, {});
      const table = action.initialize ? {...updates, ...state.table} : {...state.table, ...updates};

      return Object.assign({}, state, {
        table,
      });
    }

    case CONTACTS_ERROR:
      return Object.assign({}, state, {
        error: action.error ? action.error : new Error('unknown contacts error'),
        loading: false,
      });

    default:
      return state;
  }
}

export default contactsReducer;
