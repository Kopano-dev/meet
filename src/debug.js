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

  addFakeStream = ({ withScreenshare, id } = {}) => {
    const { dispatch, getState } = this;
    const { umAudioVideoStreams } = getState().media;

    if (!id) {
      id = 'callview-main';
    }

    console.log('xxx um', umAudioVideoStreams);
    const stream = umAudioVideoStreams[id] ? umAudioVideoStreams[id] : new MediaStream();

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
      stream,
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
        stream,
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

  destroyForAllPeerConnections = () => {
    const { connections } = this.getState().kwm;

    Object.values(connections).forEach(connection => {
      console.debug('trigger destro for', connection); // eslint-disable-line no-console
      connection.destroy(new Error('destroy via debug'));
    });
  }
}

export function registerGlobalDebugger(store) {
  window.meetDebug = new MeetDebug(store);

  console.warn('Meet debugger registered at window.meetDebug', window.meetDebug); // eslint-disable-line no-console
}
