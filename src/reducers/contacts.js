import {
  ADD_CONTACTS,
} from '../actions/types';

const defaultState = {
  sorted: [],
  table: {},
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
    case ADD_CONTACTS: {
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

    default:
      return state;
  }
}

export default contactsReducer;
