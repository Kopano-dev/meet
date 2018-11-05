import {
  ADD_OR_UPDATE_RECENT,
  REMOVE_RECENT,
} from '../actions/types';

const maxRecentsCount = 20;
let globalIDCount = 0;

const defaultState = {
  sorted: [],
  table: {},
};

function recentsReducer(state = defaultState, action) {
  switch (action.type) {
    case ADD_OR_UPDATE_RECENT: {
      const recentsID = action.id ? `${action.kind}_${action.id}` : 'local_'+(++globalIDCount);

      const sorted = state.sorted.filter(rid => rid !== recentsID);
      sorted.unshift(recentsID);

      const table = {};
      if (sorted.length > maxRecentsCount) {
        sorted.splice(maxRecentsCount);
        for (const rid of sorted) {
          table[rid] = state.table[rid];
        }
      } else {
        Object.assign(table, state.table);
      }
      table[recentsID] = {
        ...action.entry,
        ...{ date: action.date || new Date() },
        kind: action.kind,
      };

      return Object.assign({}, state, {
        sorted,
        table,
      });
    }

    case REMOVE_RECENT: {
      const recentsID = action.rid;

      const sorted = state.sorted.filter(rid => rid !== recentsID);
      const table = Object.assign({}, state.table);
      delete table[recentsID];

      return Object.assign({}, state, {
        sorted,
        table,
      });
    }

    default:
      return state;
  }
}

export default recentsReducer;
