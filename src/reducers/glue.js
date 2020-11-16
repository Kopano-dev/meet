import {
  KPOP_GLUE_GLUED,
} from 'kpop/es/common/constants';

import {
  KWM_CHANNEL_CHANGED,
} from '../actions/types';

const defaultState = {
  glue: null,
};

function glueReducer(state = defaultState, action) {
  const { glue } = state;

  if (!glue && action.type !== KPOP_GLUE_GLUED) {
    return state;
  }

  switch (action.type) {
    case KPOP_GLUE_GLUED:
      return Object.assign({}, state, {
        glue: action.glue,
      });

    case KWM_CHANNEL_CHANGED:
      glue.dispatchEvent({
        type: 'channelChanged',
      }, action.channel);
      break;

    default:
  }

  return state;
}

export default glueReducer;
