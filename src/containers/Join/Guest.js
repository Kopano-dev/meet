import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { withStyles } from '@material-ui/core/styles';
import DialogContent from '@material-ui/core/DialogContent';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import PersonIcon from '@material-ui/icons/Person';
import Link from '@material-ui/core/Link';

import { FormattedMessage } from 'react-intl';

import { setError } from 'kpop/es/common/actions';
import { initializeUserWithConfig } from 'kpop/es/config/actions';
import { removeUser, startSignin } from 'kpop/es/oidc/actions';
import { updateOIDCState } from 'kpop/es/oidc/state';

import { setGuest } from '../../actions/meet';
import { JoinBackground } from '../../artwork';

const styles = () => {
  return {
    top: {
      minHeight: 48,
      maxHeight: 225,
      height: '25vh',
      flexShrink: 0,
      position: 'relative',
      '&:before': {
        content: '""',
        position: 'absolute',
        left: -228,
        right: 0,
        bottom: 0,
        top: 10,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundImage: `url("${JoinBackground}#svgView(preserveAspectRatio(none))")`,
      },
    },
    header: {
      flex: 1,
      textAlign: 'center',
    },
    actions: {
      textAlign: 'center',
    },
    form: {
      maxWidth: 370,
      margin: '0 auto',
    },
  };
};

// Guest types supported by KWM server.
const GUEST_TYPE_SIMPLE = '1';

class Guest extends React.PureComponent {
  constructor(props) {
    super(props);

    const { guest } = props;

    this.state = {
      loading: false,
      error: false,
      invalid: false,

      name: guest.name ? guest.name : '',
    };
  }

  handleNextClick = async () => {
    const {
      navigate,
      setGuest,
      initializeUserWithConfig,
      setError,
      config,
      user,
      guest,
      entry,
    } = this.props;
    const { name } = this.state;

    this.setState({
      loading: true,
    });

    if (user && !guest.user) {
      navigate('join:settings');
    } else {
      // Update guest data.
      const mode = guest.guest ? guest.guest : GUEST_TYPE_SIMPLE;
      await setGuest({
        ...guest,
        guest: mode,
        path: `${entry.scope}/${entry.id}`,
        name,
      });
      initializeUserWithConfig(config, {dispatchError: false, removeUser: true, noRedirect: true})
        .then(user => {
          if (user) {
            // Navigate and add guest mode to URL hash until a better way was
            // made to retain guest mode settings accross reloads.
            const options = {};
            let hash = window.location.hash;
            if (hash.indexOf('guest=') === -1) {
              if (hash === '') {
                hash += '#';
              } else if (hash.length > 1) {
                hash += '&';
              }
              hash += 'guest=' + mode;
              options.hash = hash;
            }
            navigate('join:settings', false, options);
          } else {
            this.setState({
              loading: false,
              error: true,
            });
          }
        })
        .catch(reason => {
          setError({
            message: 'Failed to create guest session.',
            detail: reason,
            fatal: false,
            options: {
              key: 'join:guest_signin_failed',
            },
          });
          this.setState({
            loading: false,
            error: true,
          });
        });
    }
  }

  handleSignInClick = async event => {
    const { startSignin, setGuest } = this.props;

    event.preventDefault();

    updateOIDCState({
      state: 'join:cb',
      options: {
        dispatchError: false,
        noRedirect: true,
      },
    });
    await setGuest({
      guest: null,
      path: undefined,
      name: '',
    });
    await startSignin();
  }

  handleChangeName = event => {
    this.setState({
      name: event.target.value,
      nameTooLong: event.target.value.length > 20,
    });
  }

  handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      this.handleNextClick();
    }
  }

  render() {
    const { classes, className: classNameProp } = this.props;
    const { loading, name, nameTooLong } = this.state;

    const nameError = nameTooLong ? 'Please use a shorter name.' : null;

    return <React.Fragment>
      <div className={classes.top}>
      </div>
      <DialogContent className={classNameProp}>
        <div className={classes.header}>
          <Typography gutterBottom variant="h6"><FormattedMessage id="joinscreen.guest.header" defaultMessage="Enter your name"></FormattedMessage></Typography>
          <div className={classes.form}>
            <TextField
              autoFocus
              autoComplete="name"
              fullWidth
              margin="dense"
              className={classes.textField}
              InputProps={{
                startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment>,
              }}
              value={name}
              onChange={this.handleChangeName}
              onKeyPress={this.handleKeyPress}
              variant="outlined"
              error={!!nameError}
              helperText={nameError}
            />
            <Typography variant="caption" gutterBottom>
              <FormattedMessage
                id="joinscreen.guest.suffixText"
                defaultMessage="The name defines how you are visible to others as guest. If you have an account, you can {signInLink} too"
                values={{
                  signInLink: <Link href="#" onClick={this.handleSignInClick}>
                    <FormattedMessage
                      id="joinscreen.guest.suffixText.signInLink"
                      defaultMessage="sign in">
                    </FormattedMessage>
                  </Link>,
                }}
              ></FormattedMessage>
            </Typography>
          </div>
        </div>
        <div className={classes.actions}>
          <Button
            disabled={loading || !!nameError}
            variant="contained"
            color="primary"
            onClick={this.handleNextClick}>
            <FormattedMessage
              id="joinscreen.nextButton.text"
              defaultMessage="Next">
            </FormattedMessage>
          </Button>
        </div>
      </DialogContent>
    </React.Fragment>;
  }
}

Guest.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,

  setError: PropTypes.func.isRequired,
  initializeUserWithConfig: PropTypes.func.isRequired,
  setGuest: PropTypes.func.isRequired,
  removeUser: PropTypes.func.isRequired,
  startSignin: PropTypes.func.isRequired,

  config: PropTypes.object.isRequired,
  user: PropTypes.object,
  guest: PropTypes.object.isRequired,

  navigate: PropTypes.func.isRequired,
  entry: PropTypes.object.isRequired,
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
  initializeUserWithConfig,
  setGuest,
  removeUser,
  startSignin,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Guest));
