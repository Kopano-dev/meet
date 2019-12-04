import React from 'react';
import ReactDOM from 'react-dom';
import Loadable from 'react-loadable';
import { Provider } from 'react-redux';

import { MuiThemeProvider } from '@material-ui/core/styles';

import moment from './moment';
import Moment from 'react-moment';

import { defaultTheme as theme } from 'kpop/es/theme';
import IntlContainer from 'kpop/es/IntlContainer';
import Loading from 'kpop/es/Loading';
import registerServiceWorker from 'kpop/es/serviceWorker';

import './adapter';
import configureStore from './configureStore';
import translations from './locales';
import { registerGlobalDebugger } from './debug';
import meetTheme from './theme';

const { store, history } = configureStore();

registerServiceWorker(store, {
  env: process.env.NODE_ENV, /*eslint-disable-line no-undef*/
  publicUrl: process.env.PUBLIC_URL, /*eslint-disable-line no-undef*/
});

if (process.env.NODE_ENV !== 'production') {  /*eslint-disable-line no-undef*/
  registerGlobalDebugger(store);
}

const onLocaleChanged = async locale => {
  console.info('locale', locale); // eslint-disable-line no-console

  moment.locale(locale);
  // Setup moment.
  Moment.globalMoment = moment;
  Moment.globalLocale = moment.locale();
  console.info('moment locale', Moment.globalLocale); // eslint-disable-line no-console
  Moment.startPooledTimer();
};

// NOTE(longsleep): Load async with loader, this enables code splitting via Webpack.
const LoadableApp = Loadable({
  loader: () => import(/* webpackChunkName: "meet-container" */ './containers/Meet'),
  loading: Loading,
  timeout: 20000,
});

ReactDOM.render(
  <Provider store={store}>
    <MuiThemeProvider theme={theme}>
      <MuiThemeProvider theme={meetTheme}>
        <IntlContainer onLocaleChanged={onLocaleChanged} messages={translations}>
          <LoadableApp history={history}/>
        </IntlContainer>
      </MuiThemeProvider>
    </MuiThemeProvider>
  </Provider>,
  document.getElementById('root')
);
