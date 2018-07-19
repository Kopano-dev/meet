const darkGrey = '#272c2e';
const lightBlue = '#3eb4f3';
const lightGrey = '#c1c1c1';

const meetTheme = outerThemme => ({
  ...outerThemme,
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
