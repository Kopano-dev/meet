import React from 'react';
import ReactDOM from 'react-dom';

import { Provider } from 'react-redux';

import { MuiThemeProvider } from '@material-ui/core/styles';

import { defaultTheme as theme } from 'kpop/es/theme';
import IntlContainer from 'kpop/es/IntlContainer';

import configureStore from './configureStore';
import meetTheme from './theme';
import App from './Main';

const { store, history } = configureStore();

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <Provider store={store}>
      <MuiThemeProvider theme={theme}>
        <MuiThemeProvider theme={meetTheme}>
          <IntlContainer>
            <App history={history}/>
          </IntlContainer>
        </MuiThemeProvider>
      </MuiThemeProvider>
    </Provider>, div);
});
