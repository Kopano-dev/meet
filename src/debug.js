import * as Debug from 'debug';

import * as types from './actions/types';

class MeetDebug {
  constructor(store) {
    this.counter = 0;

    this.store = store;
    this.dispatch = store.dispatch.bind(store);
    this.getState = store.getState.bind(store);
  }

  addFakeStream = () => {
    const { dispatch } = this;

    const record = {
      user: `fake-user-${this.counter++}`,
    };
    const stream = new MediaStream();

    dispatch({
      type: types.KWM_STREAM_RECEIVED,
      record,
      stream,
    });
  };

  toggleWebRTCDebug = (flag = true) => {
    if (flag) {
      Debug.enable('simple-peer');
    } else {
      Debug.disable('simple-peer');
    }
  }
}

export function registerGlobalDebugger(store) {
  window.meetDebug = new MeetDebug(store);

  console.warn('Meet debugger registered at window.meetDebug', window.meetDebug); // eslint-disable-line no-console
}
