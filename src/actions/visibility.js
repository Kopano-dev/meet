import {
  VISIBILITY_CHANGE,
} from './types';

let visibilityManager = null;
let initiallyHidden = true;

export function initializeVisibility() {
  return async (dispatch) => {
    if (visibilityManager) {
      return initiallyHidden;
    }

    initiallyHidden = document.hidden;

    document.addEventListener('visibilitychange', () => {
      const { hidden, visibilityState } = document;
      dispatch(visbilityChange(hidden, visibilityState));
    }, false);

    await dispatch(visbilityChange(initiallyHidden, document.visibilityState));
    return initiallyHidden;
  };
}

function visbilityChange(hidden, visibilityState) {
  return {
    type: VISIBILITY_CHANGE,
    hidden,
    visibilityState,
  };
}
