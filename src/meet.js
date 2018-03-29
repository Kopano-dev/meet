import React from 'react';
import ReactDOM from 'react-dom';
import Loadable from 'react-loadable';
import { Provider } from 'react-redux';

import Loading from 'kpop/es/Loading';

import store from './store';

import { MuiThemeProvider } from 'material-ui/styles';
import theme from './theme';

import registerServiceWorker from './registerServiceWorker';
registerServiceWorker(store);

// NOTE(longsleep): Load async with loader, this enables code splitting via Webpack.
const LoadableApp = Loadable({
  loader: () => import('./containers/Meet'),
  loading: Loading,
  timeout: 20000,
});

ReactDOM.render(
  <Provider store={store}>
    <MuiThemeProvider theme={theme}>
      <LoadableApp />
    </MuiThemeProvider>
  </Provider>,
  document.getElementById('root')
);
