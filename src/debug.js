import * as Debug from 'debug';

import { setLogLevel } from 'kpop/es/oidc/usermanager';

import * as types from './actions/types';


class MeetDebug {
  constructor(store) {
    this.counter = 0;
    this.tokens = 0;

    this.store = store;
    this.dispatch = store.dispatch.bind(store);
    this.getState = store.getState.bind(store);
  }

  addFakeStream = ({ withScreenshare } = {}) => {
    const { dispatch } = this;

    const record = {
      user: `fake-user-${++this.counter}`,
    };

    dispatch({
      type: types.KWM_CALL_NEW,
      record,
      user: {
        displayName: `Fake ${record.user}`,
      },
    });
    dispatch({
      type: types.KWM_STREAM_RECEIVED,
      record,
      stream: new MediaStream(),
    });

    if (withScreenshare) {
      const token = `${++this.tokens}`;
      dispatch({
        type: types.KWM_STREAMS_ANNOUNCE,
        record,
        added: [{
          id: 'screen1',
          kind: 'screenshare',
          token,
        }],
        removed: [],
      });
      dispatch({
        type: types.KWM_STREAM_RECEIVED,
        record,
        stream: new MediaStream(),
        token,
      });
    }
  };

  toggleWebRTCDebug = (flag = true) => {
    if (flag) {
      Debug.enable('simple-peer');
    } else {
      Debug.disable('simple-peer');
    }
  }

  toggleOIDCDebug = (flag = true) => {
    if (flag) {
      setLogLevel(4);
    } else {
      setLogLevel();
    }
  }
}

export function registerGlobalDebugger(store) {
  window.meetDebug = new MeetDebug(store);

  console.warn('Meet debugger registered at window.meetDebug', window.meetDebug); // eslint-disable-line no-console
}
