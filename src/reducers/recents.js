import {
  ADD_OR_UPDATE_RECENT,
  REMOVE_RECENT,
  SET_RECENTS,
} from '../actions/types';

export const maxRecentsCount = 30;

const defaultState = {
  sorted: [],
  table: {},
};

function recentsReducer(state = defaultState, action) {
  switch (action.type) {
    case ADD_OR_UPDATE_RECENT: {
      const recentsID = action.rid;

      let sorted = state.sorted.filter(rid => rid !== recentsID);
      sorted.unshift(recentsID);

      const table = {};
      let superfluous = [];
      if (sorted.length > maxRecentsCount) {
        superfluous = sorted.splice(maxRecentsCount);
        sorted = sorted.splice(0, maxRecentsCount);
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

      if (action.cleanup && superfluous.length > 0) {
        // Allow caller action to trigger cleanup.
        setTimeout(action.cleanup, 0, superfluous);
      }

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

    case SET_RECENTS: {
      const sorted = action.sorted.slice(0, maxRecentsCount);
      const table = Object.assign({}, action.table);

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
