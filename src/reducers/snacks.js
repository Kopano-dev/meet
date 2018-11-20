import {
  KPOP_SET_ERROR,
} from 'kpop/es/common/constants';

import {
  SNACKS_SHIFT,
  SNACKS_ADD,
} from '../actions/types';

const defaultState = {
  snacks: [],
};

function snacksReducer(state = defaultState, action) {
  switch (action.type) {
    case KPOP_SET_ERROR: {
      if (action.error && !action.error.fatal) {
        const snacks = state.snacks.slice(0);
        snacks.push({...action.error, variant: 'error'});
        return Object.assign({}, state, {
          snacks,
        });
      }
      break;
    }

    case SNACKS_ADD: {
      const snacks = state.snacks.slice(0);
      snacks.push(action.snack);
      return Object.assign({}, state, {
        snacks,
      });
    }

    case SNACKS_SHIFT: {
      const snacks = state.snacks.slice(1);
      return Object.assign({}, state, {
        snacks,
      });
    }
  }

  return state;
}

export default snacksReducer;
