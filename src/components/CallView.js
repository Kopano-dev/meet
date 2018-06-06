import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { withStyles } from 'material-ui/styles';
import Tabs, { Tab } from 'material-ui/Tabs';
import VideocallIcon from 'material-ui-icons/Videocam';
import CallIcon from 'material-ui-icons/Call';
import MicIcon from 'material-ui-icons/Mic';
import MicOffIcon from 'material-ui-icons/MicOff';
import CamIcon from 'material-ui-icons/Videocam';
import CamOffIcon from 'material-ui-icons/VideocamOff';
import Button from 'material-ui/Button';
import HangupIcon from 'material-ui-icons/CallEnd';
import red from 'material-ui/colors/red';
import SearchIcon from 'material-ui-icons/Search';
import IconButton from 'material-ui/IconButton';
import AddIcon from 'material-ui-icons/Add';

import renderIf from 'render-if';

import { setError } from 'kpop/es/common/actions';
import TopBar from 'kpop/es/TopBar';
import { userShape } from 'kpop/es/shapes';

import { fetchContacts, addContacts } from '../actions/contacts';
import { addOrUpdateRecentsFromContact } from '../actions/recents';
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
import FullscreenDialog from './FullscreenDialog';
import Recents from './Recents';
import ContactSearch from './ContactSearch';
import { Howling } from './howling';
import { debounce, forceBase64StdEncoded } from '../utils';


// NOTE(longsleep): Poor mans check if on mobile.
const isMobile = /Mobi/.test(navigator.userAgent);
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints;
const xsHeightDownBreakpoint = '@media (max-height:450px)';
const minimalHeightDownBreakpoint = '@media (max-height:275px)';
console.info('Is mobile', isMobile); // eslint-disable-line no-console
console.info('Is touch device', isTouchDevice); // eslint-disable-line no-console

const styles = theme => ({
  root: {
    height: '100vh',
    position: 'relative',
  },
  rootWithHover: {
    '&:hover $controlsPermanentHidden, &:hover $controlsMiddleHidden': {
      opacity: 0.7,
    },
  },
  rootWasTouched: {
    '& $controlsPermanentHidden, & $controlsMiddleHidden': {
      opacity: 0.7,
    },
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
    opacity: 1,
    transition: theme.transitions.create('opacity', {
      easing: theme.transitions.easing.easeOut,
    }),
  },
  controlsMiddleHidden: {
    opacity: 0,
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
      left: theme.spacing.unit,
      top: 0,
      transform: 'scale(.8, .8)',
    },
    [xsHeightDownBreakpoint]: {
      transform: 'scale(.8, .8)',
      top: 0,
    },
    transition: theme.transitions.create('opacity', {
      easing: theme.transitions.easing.easeOut,
    }),
  },
  controlsPermanentStandby: {
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  controlsPermanentHidden: {
    opacity: 0,
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
    [xsHeightDownBreakpoint]: {
      minHeight: 10,
      height: '10vh',
    },
    [minimalHeightDownBreakpoint]: {
      minHeight: 0,
      height: 0,
    },
  },
  callWithoutCall: {
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
  modeBar: {
    margin: '0 auto',
    [minimalHeightDownBreakpoint]: {
      display: 'none',
    },
    paddingTop: theme.spacing.unit,
  },
  tabs: {
  },
  tab: {
    maxWidth: 90,
    minWidth: 90,
  },
  appBar: {
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  recents: {
    margin: '10px auto 0 auto',
    maxWidth: 400,
    width: '100%',
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    [minimalHeightDownBreakpoint]: {
      paddingTop: 0,
    },
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.unit * 4,
    right: theme.spacing.unit * 3,
  },
});

class CallView extends React.PureComponent {
  localStreamID = 'callview-main';

  constructor(props) {
    super(props);

    this.state = {
      mode: props.hidden ? 'standby' : 'videocall',
      wasTouched: false,
      muteCam: false,
      muteMic: false,
      openDialogs: {},
    };

    this.touchedTimer = null;
  }

  componentDidMount() {
    const { fetchContacts } = this.props;
    fetchContacts().catch(err => {
      // Ignore errors here, let global handler do it.
      console.error('failed to fetch contacts', err); // eslint-disable-line no-console
    });

    this.updateOfferAnswerConstraints();
    this.requestUserMedia();
  }

  componentDidUpdate(prevProps, prevState) {
    const { mode, muteCam, muteMic } = this.state;
    const {
      hidden,
      channel,
      connected,
      localAudioVideoStreams,
      setLocalStream,
    } = this.props;

    if (mode !== prevState.mode) {
      this.updateOfferAnswerConstraints();
      this.requestUserMedia();
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

    if (hidden !== prevProps.hidden || channel !== prevProps.channel) {
      if (mode !== 'standby') {
        if (hidden && !channel) {
          // Switch to standby.
          console.info('Switching to standby after hide'); // eslint-disable-line no-console
          this.setState({
            mode: 'standby',
          });
        }
      } else {
        if (prevProps.hidden && !hidden) {
          console.info('Switching to previous mode after no longer hide'); // eslint-disable-line no-console
          this.setState({
            mode: 'videocall',
          });
        }
      }
    }
  }

  handleCallGridClick = () => {
    // Set a touched state if touch device and reset it after a short timeout.
    clearTimeout(this.touchedTimer);
    this.setState({
      wasTouched: true,
    }, () => {
      this.touchedTimer = setTimeout(() => {
        this.setState({
          wasTouched: false,
        });
      }, 3000);
    });
  };

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
    const { doCall, addOrUpdateRecentsFromContact, localAudioVideoStreams } = this.props;

    const localStream = localAudioVideoStreams[this.localStreamID];
    this.wakeFromStandby().then(() => {
      if (localStream && localStream.active) {
        return;
      }
      return this.requestUserMedia();
    }).then(() => {
      addOrUpdateRecentsFromContact(id);

      // XXX(longsleep): Remove Base64 conversion once kwmserverd/konnectd is
      // updated to use URL-safe ids which is required since contact IDs come
      // from the REST API which is Base64 encoded while konnect requires the
      // IDs in Standard encoding.
      doCall(forceBase64StdEncoded(id));
    });
  };

  handleRecentEntryClick = (id) => {
    // XXX(longsleep): For now handle recent entries click as contact clicks.
    // This will stop working once we have other things than contacts in there.
    this.handleContactClick(id);
  };

  handleFabClick = () => {
    this.openDialog({ newCall: true});
  };

  handleAcceptClick = (id) => {
    const  { doAccept, localAudioVideoStreams } = this.props;

    const localStream = localAudioVideoStreams[this.localStreamID];
    this.closeAllOpenDialogs();
    this.wakeFromStandby().then(() => {
      if (localStream && localStream.active) {
        return;
      }
      return this.requestUserMedia();
    }).then(() => {
      doAccept(id);
    });
  }

  handleHangupClick = () => {
    const { doHangup } = this.props;

    doHangup();
  };

  handleRejectClick = (id) => {
    const { doReject } = this.props;

    doReject(id);
  }

  wakeFromStandby = () => {
    const { mode, muteCam } = this.state;

    return new Promise((resolve) => {
      if (mode === 'standby') {
        // Wake to call mode when video is muted, videocall otherwise.
        const newMode = muteCam ? 'call' : 'videocall';
        this.setState({
          mode: newMode,
        }, resolve);
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  openDialog = (updates = {}) => {
    const { openDialogs } = this.state;

    this.setState({
      openDialogs: {...openDialogs, ...updates},
    });
  }

  closeAllOpenDialogs = () => {
    this.setState({
      openDialogs: {},
    });
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

  requestUserMedia = () => {
    const {
      mode,
      muteCam,
      muteMic,
    } = this.state;

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
      video = video && !muteCam;
      audio = audio && !muteMic;
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
        if (muteCam || !video) {
          promises.push(muteVideoStream(info.stream));
        }
        if (muteMic || !audio) {
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
      profile,
      channel,
      ringing,
      calling,
      localAudioVideoStreams,
      remoteStreams,
    } = this.props;
    const { mode, muteCam, muteMic, wasTouched, openDialogs } = this.state;

    const callClassName = classNames(
      classes.call,
      {
        [classes.callWithCall]: !!channel,
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

    const rootClassName = classNames(
      classes.root,
      {
        [classes.rootWithHover]: !isTouchDevice,
        [classes.rootWasTouched]: wasTouched,
      },
    );
    const controlsPermanentClassName = classNames(
      classes.controlsPermanent,
      {
        [classes.controlsPermanentStandby]: mode === 'standby',
        [classes.controlsPermanentHidden]: !!channel,
      }
    );
    const controlsMiddleClassName = classNames(
      classes.controlsMiddle,
      {
        [classes.controlsMiddleHidden]: !!channel,
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
        <div key='middle' className={controlsMiddleClassName}>
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
          <div className={classes.modeBar}>
            <div>
              <Tabs
                value={mode}
                onChange={this.handleModeChange}
                className={classes.tabs}
                indicatorColor="primary"
                textColor="primary"
                centered
              >
                <Tab value="videocall" className={classes.tab} icon={<VideocallIcon />} />
                <Tab value="call" className={classes.tab} icon={<CallIcon />} />
              </Tabs>
            </div>
          </div>
          {renderIf(mode === 'videocall' || mode === 'call' || mode === 'standby')(() => (
            <div>
              <TopBar
                className={classes.appBar}
                title="Meetups"
                forceAnchor
                position="static"
                user={profile}
                elevation={4}
              >
                <IconButton>
                  <SearchIcon/>
                </IconButton>
              </TopBar>
              <Recents
                className={classes.recents}
                onEntryClick={this.handleRecentEntryClick}
              />
            </div>
          ))}
          <Button variant="fab" className={classes.fab} aria-label="add" color="primary" onClick={this.handleFabClick}>
            <AddIcon />
          </Button>
        </div>
      );
    }

    for (const id in ringing) {
      const record = ringing[id];
      dialogs.push(
        <IncomingCallDialog
          open={!record.ignore}
          key={`incoming-call-${id}`}
          record={record}
          onAcceptClick={() => { this.handleAcceptClick(record.id); }}
          onRejectClick={() => { this.handleRejectClick(record.id); }}
        >
        </IncomingCallDialog>
      );
    }

    dialogs.push(
      <FullscreenDialog
        key="new-call"
        topTitle="New call"
        topElevation={0}
        open={openDialogs.newCall || false}
        onClose={() => { this.openDialog({newCall: false}); }}
      >
        <ContactSearch onContactClick={(id) => {
          this.openDialog({newCall: false});
          this.handleContactClick(id);
        }}></ContactSearch>
      </FullscreenDialog>
    );

    const localStream = localAudioVideoStreams[this.localStreamID];
    return (
      <div className={rootClassName}>
        <div className={classes.controls}>
          {controls}
        </div>
        <div className={classes.container}>
          <CallGrid
            onClick={this.handleCallGridClick}
            className={callClassName}
            mode={mode}
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

  hidden: PropTypes.bool.isRequired,
  profile: userShape.isRequired,

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
  addOrUpdateRecentsFromContact: PropTypes.func.isRequired,

  localAudioVideoStreams: PropTypes.object.isRequired,
  remoteStreams: PropTypes.array.isRequired,
};

const mapStateToProps = state => {
  const { hidden, user, profile } = state.common;
  const { connected, channel, ringing, calling } = state.kwm;
  const { audioVideoStreams: localAudioVideoStreams } = state.usermedia;

  const remoteStreams = Object.values(state.streams);

  return {
    hidden,
    profile: user ? profile : null,

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
    requestUserMedia: debounce((id='', video=true, audio=true) => {
      return dispatch(requestUserMedia(id, video, audio));
    }, 500),
    doCall: (id) => {
      return dispatch(doCall(id));
    },
    doHangup: () => {
      return dispatch(doHangup());
    },
    doAccept: (id) => {
      return dispatch(doAccept(id));
    },
    doReject: (id) => {
      return dispatch(doReject(id));
    },
    muteVideoStream: (stream, mute=true, id='') => {
      return dispatch(muteVideoStream(stream, mute, id));
    },
    muteAudioStream: (stream, mute=true, id='') => {
      return dispatch(muteAudioStream(stream, mute, id));
    },
    updateOfferAnswerConstraints: (options) => {
      return dispatch(updateOfferAnswerConstraints(options));
    },
    applyLocalStreamTracks: (info) => {
      return dispatch(applyLocalStreamTracks(info));
    },
    setLocalStream: (stream) => {
      return dispatch(setLocalStream(stream));
    },
    unsetLocalStream: () => {
      return dispatch(unsetLocalStream());
    },
    setError: (error) => {
      return dispatch(setError(error));
    },
    addOrUpdateRecentsFromContact: (id) => {
      return dispatch(addOrUpdateRecentsFromContact(id));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles, {withTheme: true})(CallView));
