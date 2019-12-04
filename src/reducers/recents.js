import {
  KPOP_RECEIVE_USER,
} from 'kpop/es/oidc/constants';

import {
  RECENTS_ADD_OR_UPDATE,
  RECENTS_REMOVE,
  RECENTS_SET,
  RECENTS_CLAIM,
  RECENTS_FETCH,
  RECENTS_ERROR,
} from '../actions/types';

export const maxRecentsCount = 30;

const defaultState = {
  guid: undefined,
  sorted: [],
  table: {},
  loading: true,
  error: null,
};

function recentsReducer(state = defaultState, action) {
  switch (action.type) {
    case RECENTS_FETCH:
      return Object.assign({}, state, {
        loading: action.loading,
        error: false,
      });

    case RECENTS_ADD_OR_UPDATE: {
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
        Promise.resolve().then(() => {
          action.cleanup(superfluous);
        });
      }

      return Object.assign({}, state, {
        sorted,
        table,
      });
    }

    case RECENTS_REMOVE: {
      const recentsID = action.rid;

      const sorted = state.sorted.filter(rid => rid !== recentsID);
      const table = Object.assign({}, state.table);
      delete table[recentsID];

      return Object.assign({}, state, {
        sorted,
        table,
      });
    }

    case RECENTS_SET: {
      const sorted = action.sorted.slice(0, maxRecentsCount);
      const table = Object.assign({}, action.table);

      return Object.assign({}, state, {
        sorted,
        table,
        guid: action.guid,
      });
    }

    case RECENTS_CLAIM: {
      return Object.assign({}, state, {
        guid: action.guid,
      });
    }

    case KPOP_RECEIVE_USER: {
      // NOTE(longsleep): Maybe also compare guid with current user.
      if (!action.user) {
        return Object.assign({}, state, {
          sorted: [],
          table: {},
          guid: undefined,
        });
      }
      return state;
    }

    case RECENTS_ERROR:
      return Object.assign({}, state, {
        error: action.error ? action.error : new Error('unknown recents error'),
        loading: false,
      });

    default:
      return state;
  }
}

export default recentsReducer;
