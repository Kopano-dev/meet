import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { persistStore, persistReducer, createTransform } from 'redux-persist';
import localForage from "localforage";
import { connectRouter, routerMiddleware } from 'connected-react-router';
import { createBrowserHistory } from 'history';

import grapiReducer from 'kpop/es/grapi/reducer';
import pwaReducer from 'kpop/es/pwa/reducer';

import reducers from './reducers';
import { basePath } from './base';
import meetMiddleWare from './middleware';

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export default () => {
  const loggerMiddleware = createLogger();
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

  const storage = localForage;
  const history = createBrowserHistory({
    basename: basePath,
  });

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
      router: connectRouter(history),

      grapi: grapiReducer,
      pwa: pwaReducer,
    }),
    composeEnhancers(applyMiddleware(
      thunkMiddleware,
      routerMiddleware(history),
      meetMiddleWare,
      loggerMiddleware // must be last middleware in the chain.
    ))
  );

  const persistor = persistStore(store, null, () => {
    console.info('Loaded persisted store data'); // eslint-disable-line no-console
  });

  return { store, storage, persistor, history };
};
