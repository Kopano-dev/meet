import {
  ADD_OR_UPDATE_RECENT,
} from '../actions/types';

let globalIDCount = 0;

const defaultState = {
  sorted: [],
  table: {},
};

function recentsReducer(state = defaultState, action) {
  switch (action.type) {
    case ADD_OR_UPDATE_RECENT: {
      const recentsID = action.id ? `${action.kind}_${action.id}` : 'local_'+(++globalIDCount);

      const sorted = state.sorted.filter(id => id !== recentsID);
      sorted.unshift(recentsID);

      const table = Object.assign({}, state.table, {
        [recentsID]: {
          ...action.entry,
          ...{ date: action.date || new Date() },
        },
      });

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
