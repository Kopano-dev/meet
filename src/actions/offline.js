import {
  OFFLINE_ONLINE,
  OFFLINE_OFFLINE,
} from './types';

let offlineManager = null;
let initiallyOnline = false;

export function initializeOffline() {
  return async (dispatch) => {
    if (offlineManager) {
      return initiallyOnline;
    }

    window.addEventListener('offline', () => {
      dispatch(nowOffline());
    });
    window.addEventListener('online', () => {
      dispatch(nowOnline());
    });

    initiallyOnline = navigator.onLine;
    await dispatch(initiallyOnline ? nowOnline() : nowOffline());

    return initiallyOnline;
  };
}

function nowOnline() {
  return {
    type: OFFLINE_ONLINE,
    offline: false,
  };
}

function nowOffline() {
  return {
    type: OFFLINE_OFFLINE,
    offline: true,
  };
}
