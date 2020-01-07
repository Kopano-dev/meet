import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { withStyles } from '@material-ui/core/styles';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';

import { setError } from 'kpop/es/common/actions';
import { startSignout } from 'kpop/es/oidc/actions';
import { updateOIDCState } from 'kpop/es/oidc/state';

import { toggleStandby, setAuto, doAutoCall, setGuest } from '../../actions/meet';
import AutoStandby from '../../components/AutoStandby';
import AudioVideo from '../../components/AudioVideo';
import FloatingCamMuteButton from '../../components/FloatingCamMuteButton';
import FloatingMicMuteButton from '../../components/FloatingMicMuteButton';

const styles = theme => {
  return {
    top: {
      minHeight: 48,
      maxHeight: '25vh',
      flex: 1,
      position: 'relative',

    },
    av: {
      backgroundImage: `linear-gradient(${theme.videoBackground.top}, ${theme.videoBackground.bottom} 100%)`,
      color: theme.palette.primary.contrastText,
    },
    controls: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: theme.spacing(1),
      zIndex: theme.zIndex.appBar + 1,
      display: 'flex',
      justifyContent: 'center',
      opacity: 1,
      transform: 'scale(.8, .8)',
      '& > *': {
        marginLeft: theme.spacing(.5),
        marginRight: theme.spacing(.5),
      },
    },
    container: {
      minHeight: 200,
    },
    header: {
      marginBottom: theme.spacing(1),
    },
    user: {
      display: 'flex',
      margin: theme.spacing(1, 0, 1, 0),
    },
    displayName: {
      flex: 1,
      paddingTop: theme.spacing(0.5),
    },
    main: {
      flex: 1,
    },
    actions: {
      textAlign: 'center',
    },
  };
};

class Settings extends React.PureComponent {
  state = {
    loading: false,
    calling: false,
  }

  componentDidMount() {
    const { toggleStandby } = this.props;

    toggleStandby(false);
  }

  componentWillUnmount() {
    const { toggleStandby } = this.props;

    toggleStandby(true);
  }

  handleNextClick = () => {
    const { auto, connected, location, setAuto, doAutoCall } = this.props;

    this.setState({
      loading: true,
      calling: true,
    }, async () => {
      // TODO(longsleep): Add toggle to change auto mode.
      await setAuto({
        auto: '2', // Default to videocall.
        ...auto,
        path: location.pathname.substr(1),
        prefix: 'join',
      });
      if (connected) {
        doAutoCall();
      }
    });
  }

  handleSignOutClick = async event => {
    const { guest, startSignout, setGuest } = this.props;

    event.preventDefault();

    updateOIDCState({
      state: 'join:cb',
      options: {
        dispatchError: false,
        noRedirect: true,
      },
    });
    if (guest.user) {
      await setGuest({
        guest: null,
        path: undefined,
        name: '',
      });
    }
    await startSignout();
  }

  render() {
    const { classes, className: classNameProp, entry, profile, localStream } = this.props;
    const { loading, calling } = this.state;

    return <React.Fragment>
      <div className={classes.top}>
        <AudioVideo stream={localStream} mirrored muted cover className={classes.av}></AudioVideo>
        <div className={classes.controls}>
          <FloatingCamMuteButton/>
          <FloatingMicMuteButton/>
        </div>
      </div>
      <DialogContent className={classNames(classes.container, classNameProp)}>
        <div className={classes.header}>
          <Typography gutterBottom variant="h6" align="center">
            {entry.scope} <em>&quot;<strong>{entry.id}</strong>&quot;</em>
          </Typography>
        </div>
        <Divider/>
        <div className={classes.user}>
          <Typography className={classes.displayName}>
            Joining as: <strong>{profile.displayName}</strong>
          </Typography>
          <Button size="small" onClick={this.handleSignOutClick} color="secondary">Sign out</Button>
        </div>
        <Divider/>
        <div className={classes.main}>

        </div>
        <div className={classes.actions}>
          <Button
            disabled={loading}
            variant="contained"
            color="primary"
            onClick={this.handleNextClick}
          >
              Join call
          </Button>
        </div>
      </DialogContent>
      <AutoStandby disabled={calling}/>
    </React.Fragment>;
  }
}

Settings.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,

  config: PropTypes.object.isRequired,
  user: PropTypes.object,
  profile: PropTypes.object,
  auto: PropTypes.object,
  guest: PropTypes.object.isRequired,
  connected: PropTypes.bool,
  location: PropTypes.object.isRequired,

  localStream: PropTypes.instanceOf(MediaStream),

  setError: PropTypes.func.isRequired,
  setAuto: PropTypes.func.isRequired,
  doAutoCall: PropTypes.func.isRequired,
  toggleStandby: PropTypes.func.isRequired,
  setGuest: PropTypes.func.isRequired,
  startSignout: PropTypes.func.isRequired,

  entry: PropTypes.object.isRequired,
};

const mapStateToProps = state => {
  const { config, user, profile } = state.common;
  const { auto, guest, localStream } = state.meet;
  const { connected } = state.kwm;
  const { location } = state.router;

  return {
    config,
    user,
    profile,
    auto,
    guest,
    localStream,
    connected,
    location,
  };
};

const mapDispatchToProps = dispatch => bindActionCreators({
  setError,
  setAuto,
  doAutoCall,
  toggleStandby,
  setGuest,
  startSignout,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Settings));
