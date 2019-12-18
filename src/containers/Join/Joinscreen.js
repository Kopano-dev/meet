import React from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { withStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import MobileStepper from '@material-ui/core/MobileStepper';

import { injectIntl, intlShape, defineMessages/*, FormattedMessage*/ } from 'react-intl';

import { setError } from 'kpop/es/common/actions';

import { pushHistory, replaceHistory } from '../../actions/meet';

import ResponsiveDialog from './ResponsiveDialog';
import Loading from './Loading';
import Welcome from './Welcome';
import Guest from './Guest';
import Settings from './Settings';

const styles = theme => {
  console.debug('theme', theme); // eslint-disable-line no-console

  return {
    root: {
      position: 'relative',
      display: 'flex',
      flex: 1,
    },
    content: {
      flex: 1,
      display: 'flex',
      background: theme.defaultBackground.top,
    },
    dialog: {
      flex: 1,
      minHeight: 250,
      maxHeight: 500,
      height: '90vh',
      display: 'flex',
      flexDirection: 'column',
    },
    view: {
      flex: 1,
      marginTop: 48,
      display: 'flex',
      flexDirection: 'column',
    },
    toolbar: {
      zIndex: 5,
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
    },
    stepper: {
      paddingTop: theme.spacing(3),
      paddingBottom: theme.spacing(2),
      background: 'transparent',
      alignSelf: 'center',
    },
    backButton: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
  };
};

const translations = defineMessages({
  backButtonAria: {
    id: 'joinscreen.backButton.aria',
    defaultMessage: 'Back',
  },
});

class Joinscreen extends React.PureComponent {
  /**
   * Join screen flow:
   *
   * - Screen: Loading 1
   * - Check whether or not the selected meeting can be joined as guest.
   * ---
   * - Screen: Welcome
   *   - If no guest ok, show sign-in button
   *     - Sign in redirect back to "Screen: Settings" or show inline error.
   *   - Else, show continue button.
   * ---
   * - Continue was clicked.
   * ---
   * - Screen: Loading 2
   * - Check if signed in.
   *   - If true, redirect to "Screen: Settings".
   * ---
   * - Screen: Guest
   * - Show form to enter name (also offer button to sign in).
   * - Name was entered, continue becomes enabled.
   * ---
   * - Continue was clicked
   * ---
   * - Screen: Loading 3
   * - Check if signed in.
   *   - If signed in but coming from "Screen: Guest", abort and show error
   *     with options to sign out or to continue as user.
   * - Sign in as guest if not signed in.
   *   - If failed, show error screen with message and retry button.
   * - Request access to default camera and microphone.
   *   - If failed, show error screen with message and retry button.
   * - Connect to server.
   * ---
   * - Screen: Settings
   * - Show form to configure and test input and output devices.
   *   - Request acess to selected devices on change.
   *     - If failed, show error message inline.
   * - Continusly monitor if signed in.
   *   - If signed out, abort and redirect to "Screen: Welcome".
   * - Continusly monitor if connected to server.
   *   - If connection lost/restored show snack and disable/enable continue button.
   * ---
   * - Continue was clicked
   * - Redirect to the meeting.
   *
   */

  state = {
    loading: false,
  }
  blocked = false;

  constructor(props) {
    super(props);

    const { location, user } = props;

    // Support some early interruptus.
    switch (location.state) {
      case 'join:cb':
        this.blocked = true;
        if (user) {
          this.navigate('join:settings', true);
        } else {
          this.navigate('join:welcome', true);
        }
        break;

      case 'join:welcome':
      default:
        this.blocked = true;
        this.navigate('join:welcome', true);
        break;
    }

    this.prepare();
  }

  componentDidUpdate() {
    this.prepare();
  }

  handleBackClick = () => {
    const { history } = this.props;

    history.goBack();
  }

  navigate = (target, replace=false) => {
    const { pushHistory, replaceHistory } = this.props;

    return Promise.resolve().then(() => {
      replace ? replaceHistory('', target) : pushHistory('', target);
    });
  }

  prepare = () => {
    const { location, config, user, guest } = this.props;
    const { loading } = this.state;

    if (loading || this.blocked) {
      return;
    }

    switch (location.state) {
      case 'join:guest':
        if (config.continue) {
          // Continue, to figure out if signed in.
          this.setState({
            loading: true,
          });
          config.continue({dispatchError: false, removeUser: true, noRedirect: true}).catch(() => {
            // Ignore error, we just try to sign in.
          }).then(() => {
            this.setState({
              loading: false,
            });
          });
        } else {
          if (user && !guest.user) {
            // Skip guest screen when signed in as non guest.
            this.navigate('join:settings', true);
          }
        }
        break;
    }
  }

  render() {
    const { classes, intl, location, match, config, user, guest } = this.props;
    const { loading } = this.state;

    const entry = {
      scope: match.params.view,
      id: match.params.id,
    };

    let View = Loading;
    let activeStep = 0;

    if (loading || this.blocked) { // eslint-disable-line
      View = Loading;
    } else {
      switch (location.state) {
        case 'join:guest':
          activeStep = 1;
          if (!config.continue) {
            if (user && !guest.user) {
              // Skip guest screen when signed in as non guest.
            } else {
              View = Guest;
            }
          }
          break;

        case 'join:settings':
          activeStep = 2;
          // Go to welcome when without user.
          if (!user) {
            this.navigate('join:welcome', true);
          } else {
            View = Settings;
          }
          break;

        case 'join:welcome':
          // Falls through.
        default:
          activeStep = 0;
          View = Welcome;
          break;
      }
    }

    if (this.blocked) {
      // Block first render if set.
      this.blocked = false;
    }

    if (!View) {
      return null;
    }

    return (
      <div className={classes.root}>
        <main
          className={classes.content}
        >
          <ResponsiveDialog
            open
            fullWidth
            maxWidth="sm"
            disableBackdropClick
            disableEscapeKeyDown
            hideBackdrop
            PaperProps={{
              elevation: 4,
            }}
          >
            <div className={classes.dialog}>
              <Toolbar disableGutters variant="dense" className={classes.toolbar}>
                {activeStep !== 0 && <React.Fragment>
                  <IconButton
                    color="inherit"
                    size="small"
                    className={classes.backButton}
                    aria-label={intl.formatMessage(translations.backButtonAria)}
                    onClick={this.handleBackClick}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                </React.Fragment>}
              </Toolbar>
              <View entry={entry} navigate={this.navigate} className={classes.view}/>
              <MobileStepper
                variant="dots"
                steps={3}
                activeStep={activeStep}
                position="static"
                className={classes.stepper}
              ></MobileStepper>
            </div>
          </ResponsiveDialog>
        </main>
      </div>
    );
  }
}

Joinscreen.propTypes = {
  classes: PropTypes.object.isRequired,
  intl: intlShape.isRequired,
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,

  config: PropTypes.object.isRequired,
  user: PropTypes.object,
  guest: PropTypes.object.isRequired,

  setError: PropTypes.func.isRequired,
  pushHistory: PropTypes.func.isRequired,
  replaceHistory: PropTypes.func.isRequired,
};

const mapStateToProps = state => {
  const { config, user } = state.common;
  const { guest } = state.meet;

  return {
    config,
    user,
    guest,
  };
};

const mapDispatchToProps = dispatch => bindActionCreators({
  setError,
  pushHistory,
  replaceHistory,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(injectIntl(Joinscreen)));
