import {
  USERMEDIA_AUDIOVIDEO_STREAM,
} from '../actions/types';


const defaultState = {
  audioVideoStream: null,
};

function usermediaReducer(state = defaultState, action) {
  switch (action.type) {
    case USERMEDIA_AUDIOVIDEO_STREAM:
      return Object.assign({}, state, {
        audioVideoStream: action.stream,
      });

    default:
      return state;
  }
}

export default usermediaReducer;
