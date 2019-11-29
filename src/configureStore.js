import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { persistStore, persistReducer, createTransform } from 'redux-persist';
import localForage from "localforage";

import grapiReducer from 'kpop/es/grapi/reducer';
import pwaReducer from 'kpop/es/pwa/reducer';

import reducers from './reducers';

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export default () => {
  const loggerMiddleware = createLogger();
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

  const storage = localForage;

  const mediaPersistConfig = {
    key: 'kopano-meet-redux-media',
    version: 1,
    storage: storage,
    whitelist: [
      'videoSourceId',
      'audioSourceId',
      'audioSinkId',
    ],
    transforms: [
      createTransform(null, (outboundState) => {
        if (isSafari) {
          // NOTE(longsleep): Safari uses random device IDs which change on
          // every startup. Thus reading those from the persistent store is
          // kind of useless.
          return '';
        }
        return outboundState;
      }, {
        whitelist: [
          'videoSourceId',
          'audioSourceId',
          'audioSinkId',
        ],
      }),
    ],
  };

  const store = createStore(
    combineReducers({
      ...reducers,
      media: persistReducer(mediaPersistConfig, reducers.media),

      grapi: grapiReducer,
      pwa: pwaReducer,
    }),
    composeEnhancers(applyMiddleware(
      thunkMiddleware,
      loggerMiddleware // must be last middleware in the chain.
    ))
  );

  const persistor = persistStore(store, null, () => {
    console.info('Loaded persisted store data'); // eslint-disable-line no-console
  });

  return { store, storage, persistor };
};
