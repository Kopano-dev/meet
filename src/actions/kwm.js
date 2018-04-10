import * as KWM from 'kwmjs';

import * as types from './types';
import { setError } from './common';

console.info(`Kopano KWM js version: ${KWM.version}`); // eslint-disable-line no-console

// Reference to the active KWM.
let kwm = null;

export function connectToKWM() {
  return async (dispatch, getState) => {
    const { user } = getState().common;

    if (user === null || !user.profile) {
      throw new Error('no user for KWM connect');
    }
    if (kwm === null) {
      kwm = await dispatch(createKWMManager());
    }

    return kwm.connect(user.profile.sub);
  };
}

export function createKWMManager() {
  return async (dispatch, getState) => {
    const { config } = getState().common;
    const { options } = getState().kwm;

    if (!config.kwm) {
      throw new Error('config is missing KWM configuration data');
    }

    KWM.KWMInit.init({}); // Set default options.
    const k = new KWM(config.kwm.url, options);

    k.onstatechanged = event => {
      dispatch(kwmStateChange(event));
    };
    k.onerror = event => {
      dispatch(kwmError(event));
    };

    return k;
  };
}

export function kwmError(event) {
  return async (dispatch) => {
    // TODO(longsleep): Make only fatal if kwm is not reconnecting.
    const error = {
      message: `Error: KWM error - ${event.msg} (${event.code})`,
      fatal: true,
    };

    await dispatch(setError(error));
  };
}

export function kwmStateChange(event) {
  const { connecting, connected, reconnecting } = event;

  return {
    type: types.KWM_STATE_CHANGE,
    connecting,
    connected,
    reconnecting,
  };
}
