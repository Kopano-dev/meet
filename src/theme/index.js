import { createMuiTheme } from '@material-ui/core/styles';

import kopanoGreen from 'kpop/es/colors/kopanoGreen';

const darkGrey = '#272c2e';
const lightBlue = '#3eb4f3';
const lightGrey = '#c1c1c1';

const theme = createMuiTheme({
  palette: {
    primary: {
      light: kopanoGreen[400],
      main: kopanoGreen[500],
      dark: kopanoGreen[600],
    },
    // NOTE(longsleep): KopanoGreen is too light and thus needs 2.0 contrastThreshold
    // to make sure the default 500 color is still using white text. It will
    // show warnings in development mode that the contrast is too low as W3C
    // recommends the threshold to be 3 or more. This cannot be helped.
    contrastThreshold: 2.0,
  },
});

const meetTheme = outerTheme => ({
  ...outerTheme,
  palette: {
    ...outerTheme.palette,
    primary: {...theme.palette.primary},
  },
  callBackground: {
    top: lightBlue,
    bottom: darkGrey,
  },
  videoBackground: {
    top: lightGrey,
    bottom: darkGrey,
  },
});

export default meetTheme;
