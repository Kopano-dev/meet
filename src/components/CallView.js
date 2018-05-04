import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { withStyles } from 'material-ui/styles';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Tabs, { Tab } from 'material-ui/Tabs';
import VideocallIcon from 'material-ui-icons/Videocam';
import CallIcon from 'material-ui-icons/Call';
import RoomIcon from 'material-ui-icons/Group';
import MicIcon from 'material-ui-icons/Mic';
import MicOffIcon from 'material-ui-icons/MicOff';
import CamIcon from 'material-ui-icons/Videocam';
import CamOffIcon from 'material-ui-icons/VideocamOff';
import Button from 'material-ui/Button';
import HangupIcon from 'material-ui-icons/CallEnd';
import StandbyIcon from 'material-ui-icons/Spa';
import red from 'material-ui/colors/red';

import renderIf from 'render-if';

import { setError } from 'kpop/es/common/actions';

import { fetchContacts, addContacts } from '../actions/contacts';
import {
  setLocalStream,
  unsetLocalStream,
  updateOfferAnswerConstraints,
  applyLocalStreamTracks,
  doCall,
  doHangup,
  doAccept,
  doReject,
} from '../actions/kwm';
import {
  requestUserMedia,
  muteVideoStream,
  muteAudioStream,
  globalSettings as gUMSettings,
} from '../actions/usermedia';
import CallGrid from './CallGrid';
import IncomingCallDialog from './IncomingCallDialog';
import ContactSearch from './ContactSearch';
import { Howling } from './howling';

// NOTE(longsleep): Poor mans check if on mobile.
const isMobile = /Mobi/.test(navigator.userAgent);

const styles = theme => ({
  root: {
    height: '100vh',
    position: 'relative',
  },
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  controls: {
    height: 0,
  },
  controlsMiddle: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: theme.spacing.unit * 4,
    zIndex: theme.zIndex.appBar + 1,
    display: 'flex',
    justifyContent: 'center',
  },
  controlsPermanent: {
    position: 'absolute',
    left: theme.spacing.unit * 4,
    top: theme.spacing.unit * 4,
    zIndex: theme.zIndex.appBar + 1,
    display: 'flex',
    flexDirection: 'column',
    '& > *': {
      marginBottom: theme.spacing.unit * 2,
    },
    opacity: 0.7,
    [theme.breakpoints.down('xs')]: {
      left: 0,
      top: 0,
      transform: 'scale(.5, .5)',
    },
  },
  controlsPermanentStandby: {
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  hangupButton: {
    backgroundColor: red[500],
    color: 'white',
    '&:hover': {
      backgroundColor: red[700],
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        backgroundColor: red[700],
      },
    },
  },
  call: {
    height: '40vh',
    background: '#ddd',
    minHeight: 200,
    overflow: 'hidden',
    boxSizing: 'border-box',
    transition: theme.transitions.create('height', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  callOnStandby: {
    height: 0,
    minHeight: 0,
  },
  callWithCall: {
    height: '100vh',
  },
  menu: {
    boxSizing: 'border-box',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0, // See https://bugzilla.mozilla.org/show_bug.cgi?id=1043520
  },
  tabs: {
    flexGrow: 1,
  },
  tab: {
    maxWidth: 70,
    minWidth: 70,
  },
  contacts: {
    margin: '0 auto',
    paddingTop: 20,
    maxWidth: 600,
    width: '100%',
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
  },
});

class CallView extends React.PureComponent {
  localStreamID = 'callview-main';

  state = {
    withStandby: !isMobile,
    mode: isMobile ? 'videocall' : 'standby',
    muteCam: false,
    muteMic: false,
  };

  componentDidMount() {
    const { fetchContacts } = this.props;
    const { mode, muteCam, muteMic } = this.state;
    fetchContacts().catch(() => {
      // Ignore errors here, let global handler do it.
    });

    this.updateOfferAnswerConstraints();
    this.requestUserMedia(mode, muteCam, muteMic);
  }

  componentDidUpdate(prevProps, prevState) {
    const { mode, muteCam, muteMic } = this.state;
    const {
      connected,
      localAudioVideoStreams,
      setLocalStream,
    } = this.props;

    if (mode !== prevState.mode) {
      this.updateOfferAnswerConstraints();
      this.requestUserMedia(mode, muteCam, muteMic);
    }

    if (muteCam !== prevState.muteCam) {
      this.muteVideoStream(muteCam ? muteCam : mode === 'standby');
    }
    if (muteMic !== prevState.muteMic) {
      this.muteAudioStream(muteMic ? muteMic : mode === 'standby');
    }

    if (connected !== prevProps.connected) {
      const stream = localAudioVideoStreams[this.localStreamID];
      if (connected && stream) {
        console.debug('KWM connected changed while having a stream'); // eslint-disable-line no-console
        setLocalStream(stream);
      }
    }
  }

  handleModeChange = (event, mode) => {
    this.setState({
      mode,
    });
  };

  handleMuteCamClick = () => {
    this.setState({
      muteCam: !this.state.muteCam,
    });
  }

  handleMuteMicClick = () => {
    this.setState({
      muteMic: !this.state.muteMic,
    });
  }

  handleContactClick = (id) => {
    const { doCall } = this.props;

    this.wakeFromStandby();
    doCall(id);
  };

  handleHangupClick = () => {
    const { doHangup } = this.props;

    doHangup();
  };

  handleAcceptClick = (id) => {
    const  { doAccept } = this.props;

    this.wakeFromStandby();
    doAccept(id);
  }

  handleRejectClick = (id) => {
    const { doReject } = this.props;

    doReject(id);
  }

  wakeFromStandby = () => {
    const { mode, muteCam } = this.state;

    if (mode === 'standby') {
      if (muteCam) {
        this.setState({
          mode: 'call',
        });
      } else {
        this.setState({
          mode: 'videocall',
        });
      }
    }
  }

  muteVideoStream = (mute=true) => {
    const {
      localAudioVideoStreams,
      muteVideoStream,
      applyLocalStreamTracks,
    } = this.props;

    const stream = localAudioVideoStreams[this.localStreamID];
    if (stream) {
      muteVideoStream(stream, mute, this.localStreamID).then(info => applyLocalStreamTracks(info));
    }
  }

  muteAudioStream = (mute=true) => {
    const {
      localAudioVideoStreams,
      muteAudioStream,
      applyLocalStreamTracks,
    } = this.props;

    const stream = localAudioVideoStreams[this.localStreamID];
    if (stream) {
      muteAudioStream(stream, mute, this.localStreamID).then(info => applyLocalStreamTracks(info));
    }
  }

  updateOfferAnswerConstraints = () => {
    const { mode } = this.state;
    const { updateOfferAnswerConstraints } = this.props;

    if (mode === 'videocall') {
      updateOfferAnswerConstraints({
        offerToReceiveVideo: true,
      });
    } else {
      updateOfferAnswerConstraints({
        offerToReceiveVideo: false,
      });
    }
  }

  requestUserMedia = (mode, muteVideo=true, muteAudio=true) => {
    const {
      requestUserMedia,
      setLocalStream,
      unsetLocalStream,
      muteVideoStream,
      muteAudioStream,
      setError,
    } = this.props;

    let video = false;
    let audio = false;
    switch (mode) {
      case 'videocall':
        video = true; // eslint-disable-line no-fallthrough
      case 'call':
        audio = true;
        break;
      case 'standby':
        audio = false;
        video = false;
        break;
      default:
        throw new Error(`unknown mode: ${mode}`);
    }

    if (gUMSettings.muteWithAddRemoveTracks) {
      video = video && !muteVideo;
      audio = audio && !muteAudio;
    }

    return requestUserMedia(this.localStreamID, video, audio).catch(err => {
      setError({
        detail: `${err}`,
        message: 'Failed to access camera and/or microphone',
        fatal: true,
      });
      return null;
    }).then(info => {
      if (info && info.stream) {
        const promises = [];
        if (muteVideo || !video) {
          promises.push(muteVideoStream(info.stream));
        }
        if (muteAudio || !audio) {
          promises.push(muteAudioStream(info.stream));
        }
        return Promise.all(promises).then(() => {
          return info.stream;
        });
      }
      return null;
    }).then(stream => {
      if (stream) {
        setLocalStream(stream);
      } else {
        unsetLocalStream();
      }
      return stream;
    });
  };

  render() {
    const {
      classes,
      channel,
      ringing,
      calling,
      localAudioVideoStreams,
      remoteStreams,
    } = this.props;
    const { withStandby, mode, muteCam, muteMic } = this.state;

    const callClassName = classNames(
      classes.call,
      {
        [classes.callWithCall]: !!channel,
        [classes.callOnStandby]: !channel && mode === 'standby',
      },
    );

    let controls = [];
    let menu = null;
    let dialogs = [];

    let muteCamButton = null;
    let muteMicButton = null;
    let muteCamButtonIcon = muteCam ? <CamOffIcon /> : <CamIcon />;
    let muteMicButtonIcon = muteMic ? <MicOffIcon /> : <MicIcon />;
    if (mode === 'videocall' || mode === 'standby') {
      muteCamButton = (<Button
        variant="fab"
        color="inherit"
        aria-label="hangup"
        className={classes.muteCamButton}
        onClick={this.handleMuteCamClick}
      >
        {muteCamButtonIcon}
      </Button>);
    }
    if (mode === 'videocall' || mode === 'call' || mode === 'standby') {
      muteMicButton = (<Button
        variant="fab"
        color="inherit"
        aria-label="hangup"
        className={classes.muteMicButton}
        onClick={this.handleMuteMicClick}
      >
        {muteMicButtonIcon}
      </Button>);
    }

    const controlsPermanentClassName = classNames(
      classes.controlsPermanent,
      {
        [classes.controlsPermanentStandby]: mode === 'standby',
      }
    );
    controls.push(
      <div key='permanent' className={controlsPermanentClassName}>
        {muteCamButton}
        {muteMicButton}
      </div>
    );

    if (channel) {
      controls.push(
        <div key='middle' className={classes.controlsMiddle}>
          <Button
            variant="fab"
            color="inherit"
            aria-label="hangup"
            className={classes.hangupButton}
            onClick={this.handleHangupClick}
          >
            <HangupIcon />
          </Button>
        </div>
      );
    } else {
      menu = (
        <div className={classes.menu}>
          <AppBar position="static" color="inherit" elevation={0}>
            <Toolbar>
              <Tabs
                value={mode}
                onChange={this.handleModeChange}
                className={classes.tabs}
                indicatorColor="primary"
                textColor="primary"
                centered
              >
                {renderIf(withStandby)(() => (
                  <Tab value="standby" className={classes.tab} icon={<StandbyIcon />} />
                ))}
                <Tab value="videocall" className={classes.tab} icon={<VideocallIcon />} />
                <Tab value="call" className={classes.tab} icon={<CallIcon />} />
                <Tab value="room" className={classes.tab} icon={<RoomIcon />} disabled />
              </Tabs>
            </Toolbar>
          </AppBar>
          {renderIf(mode === 'videocall' || mode === 'call' || mode === 'standby')(() => (
            <ContactSearch
              className={classes.contacts}
              onContactClick={this.handleContactClick}
            />
          ))}
        </div>
      );
    }

    for (const id in ringing) {
      const record = ringing[id];
      dialogs.push(
        <IncomingCallDialog
          open={!record.ignore}
          key={id}
          record={record}
          onAcceptClick={() => { this.handleAcceptClick(record.id); }}
          onRejectClick={() => { this.handleRejectClick(record.id); }}
        >
        </IncomingCallDialog>
      );
    }

    const localStream = localAudioVideoStreams[this.localStreamID];
    return (
      <div className={classes.root}>
        <div className={classes.controls}>
          {controls}
        </div>
        <div className={classes.container}>
          <CallGrid
            className={callClassName}
            audio={mode === 'call'}
            localStream={localStream}
            remoteStreams={remoteStreams}
          />
          {menu}
        </div>
        {dialogs}
        <Howling label="ring2" playing={Object.keys(ringing).length > 0} loop/>
        <Howling label="dial1" playing={Object.keys(calling).length > 0} interval={4}/>
      </div>
    );
  }
}

CallView.propTypes = {
  classes: PropTypes.object.isRequired,

  connected: PropTypes.bool.isRequired,
  channel: PropTypes.string,
  ringing: PropTypes.object.isRequired,
  calling: PropTypes.object.isRequired,

  fetchContacts: PropTypes.func.isRequired,
  requestUserMedia: PropTypes.func.isRequired,
  doCall: PropTypes.func.isRequired,
  doHangup: PropTypes.func.isRequired,
  doAccept: PropTypes.func.isRequired,
  doReject: PropTypes.func.isRequired,
  muteVideoStream: PropTypes.func.isRequired,
  muteAudioStream: PropTypes.func.isRequired,
  updateOfferAnswerConstraints: PropTypes.func.isRequired,
  applyLocalStreamTracks: PropTypes.func.isRequired,
  setLocalStream: PropTypes.func.isRequired,
  unsetLocalStream: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,

  localAudioVideoStreams: PropTypes.object.isRequired,
  remoteStreams: PropTypes.array.isRequired,
};

const mapStateToProps = state => {
  const { connected, channel, ringing, calling } = state.kwm;
  const { audioVideoStreams: localAudioVideoStreams } = state.usermedia;

  const remoteStreams = Object.values(state.streams);

  return {
    connected,
    channel,
    ringing,
    calling,

    localAudioVideoStreams,
    remoteStreams,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    fetchContacts: async () => {
      const contacts = await dispatch(fetchContacts());
      await dispatch(addContacts(contacts.value));
    },
    requestUserMedia: async (id='', video=true, audio=true) => {
      return dispatch(requestUserMedia(id, video, audio));
    },
    doCall: async (id) => {
      return dispatch(doCall(id));
    },
    doHangup: async () => {
      return dispatch(doHangup());
    },
    doAccept: async (id) => {
      return dispatch(doAccept(id));
    },
    doReject: async (id) => {
      return dispatch(doReject(id));
    },
    muteVideoStream: async (stream, mute=true, id='') => {
      return dispatch(muteVideoStream(stream, mute, id));
    },
    muteAudioStream: async (stream, mute=true, id='') => {
      return dispatch(muteAudioStream(stream, mute, id));
    },
    updateOfferAnswerConstraints: async(options) => {
      return dispatch(updateOfferAnswerConstraints(options));
    },
    applyLocalStreamTracks: async (info) => {
      return dispatch(applyLocalStreamTracks(info));
    },
    setLocalStream: async (stream) => {
      return dispatch(setLocalStream(stream));
    },
    unsetLocalStream: async () => {
      return dispatch(unsetLocalStream());
    },
    setError: async (error) => {
      return dispatch(setError(error));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles, {withTheme: true})(CallView));
