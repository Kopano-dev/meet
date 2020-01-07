import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { withStyles } from '@material-ui/core/styles';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

import { FormattedMessage } from 'react-intl';

import { setError } from 'kpop/es/common/actions';
import KopanoMeetIcon from 'kpop/es/icons/KopanoMeetIcon';
import { updateOIDCState } from 'kpop/es/oidc/state';

import { isPublicGroup } from '../../utils';

import { JoinBackground } from '../../artwork';

const styles = () => {
  return {
    top: {
      minHeight: 48,
      maxHeight: 225,
      height: '25vh',
      flexShrink: 0,
      overflow: 'hidden',
      position: 'relative',
      '&:before': {
        content: '""',
        position: 'absolute',
        left: -180,
        right: -180,
        bottom: 0,
        top: 10,
        backgroundSize: '100% 100%',
        backgroundImage: `url("${JoinBackground}#svgView(preserveAspectRatio(none))")`,
      },
    },
    header: {
      flex: 1,
    },
    actions: {
      textAlign: 'center',
    },
  };
};

class Welcome extends React.PureComponent {
  state = {
    loading: false,
    error: false,
  }

  handleNextClick = () => {
    const { navigate } = this.props;

    this.setState({
      loading: true,
    });
    navigate('join:guest');
  }

  handleSignInClick = () => {
    const { config, user, navigate } = this.props;

    this.setState({
      loading: true,
    });

    updateOIDCState({
      state: 'join:cb',
    });

    if (config.continue) {
      // Continue, to figure out if signed in.
      config.continue({dispatchError: false, removeUser: true}).then(({user}) => {
        if (user) {
          navigate('join:settings');
        } else {
          this.setState({
            loading: false,
            error: true,
          });
        }
      }).catch((reason) => {
        console.error('failed to sign in (continue)', reason); // eslint-disable-line no-console
        this.setState({
          loading: false,
          error: true,
        });
      });
    } else {
      if (user) {
        navigate('join:settings');
      }
    }
  }

  render() {
    const { classes, entry, config, className: classNameProp } = this.props;
    const { loading } = this.state;

    const guestOK = isPublicGroup(entry, config);

    return <React.Fragment>
      <div className={classes.top}>
      </div>
      <DialogContent className={classNameProp}>
        <div className={classes.header}>
          <Typography gutterBottom variant="h6" align="center" display="block">Welcome to <KopanoMeetIcon style={{verticalAlign: 'text-bottom'}}/> Meet</Typography>
          <Typography gutterBottom align="center">
            {entry.scope} <em>&quot;<strong>{entry.id}</strong>&quot;</em>
          </Typography>
        </div>
        <div className={classes.actions}>
          {guestOK ?
            <Button
              disabled={loading}
              variant="contained"
              color="primary"
              onClick={this.handleNextClick}
            >
              <FormattedMessage
                id="joinscreen.nextButton.text"
                defaultMessage="Next">
              </FormattedMessage>
            </Button> :
            <Button
              disabled={loading}
              variant="contained"
              color="primary"
              onClick={this.handleSignInClick}
            >
              <FormattedMessage
                id="joinscreen.signInButton.text"
                defaultMessage="Sign in">
              </FormattedMessage>
            </Button>
          }
        </div>
      </DialogContent>
    </React.Fragment>;
  }
}

Welcome.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,

  config: PropTypes.object.isRequired,
  user: PropTypes.object,

  setError: PropTypes.func.isRequired,

  navigate: PropTypes.func.isRequired,
  entry: PropTypes.object.isRequired,
};

const mapStateToProps = state => {
  const { config, user } = state.common;

  return {
    config,
    user,
  };
};

const mapDispatchToProps = dispatch => bindActionCreators({
  setError,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Welcome));
