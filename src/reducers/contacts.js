import {
  ADD_CONTACTS,
} from '../actions/types';

const defaultState = {
  sorted: [],
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

      return Object.assign({}, state, {
        sorted,
      });
    }

    default:
      return state;
  }
}

export default contactsReducer;
