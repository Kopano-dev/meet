import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { persistStore, persistReducer } from 'redux-persist';
import localForage from "localforage";

import grapiReducer from 'kpop/es/grapi/reducer';
import pwaReducer from 'kpop/es/pwa/reducer';

import reducers from './reducers';

export default () => {
  const loggerMiddleware = createLogger();
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

  const storage = localForage;

  // TODO(longsleep): Make the storage key user specific, so the persistency
  // data is user specific.
  const recentsPersistConfig = {
    key: 'kopano-meet-redux-recents',
    version: 1,
    storage: storage,
  };

  const store = createStore(
    combineReducers({
      ...reducers,
      recents: persistReducer(recentsPersistConfig, reducers.recents),

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
