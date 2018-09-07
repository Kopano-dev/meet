import {
  CONTACTS_FETCH,
  CONTACTS_ADD,
  CONTACTS_ERROR,
} from '../actions/types';

const defaultState = {
  sorted: [],
  table: {},
  loading: true,
  error: null,
};

const sortable = (a) => {
  return `${a.displayName} ${a.givenName} ${a.surname}zzz,${a.userPrincipalName}`.trim().toLowerCase();
};

const sorter = (a, b) => {
  const as = sortable(a);
  const bs = sortable(b);

  return as.localeCompare(bs);
};

function contactsReducer(state = defaultState, action) {
  switch (action.type) {
    case CONTACTS_FETCH:
      return Object.assign({}, state, {
        loading: action.loading,
        error: false,
      });

    case CONTACTS_ADD: {
      const sorted = [...action.contacts];
      sorted.sort(sorter);
      const table = sorted.reduce((map, contact) => {
        map[contact.id] = contact;
        return map;
      }, {});

      return Object.assign({}, state, {
        sorted,
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
