import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Redirect, Route, Switch } from 'react-router-dom';

import { withStyles } from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import HistoryIcon from '@material-ui/icons/History';
import PeopleIcon from '@material-ui/icons/People';
import MicIcon from '@material-ui/icons/Mic';
import MicOffIcon from '@material-ui/icons/MicOff';
import CamIcon from '@material-ui/icons/Videocam';
import CamOffIcon from '@material-ui/icons/VideocamOff';
import Button from '@material-ui/core/Button';
import HangupIcon from '@material-ui/icons/CallEnd';
import red from '@material-ui/core/colors/red';
import SearchIcon from '@material-ui/icons/Search';
import IconButton from '@material-ui/core/IconButton';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Tooltip from '@material-ui/core/Tooltip';
import SettingsIcon from '@material-ui/icons/Settings';
import AddCallIcon from 'mdi-material-ui/PhonePlus';
import OfflineIcon from 'mdi-material-ui/LanDisconnect';
import Divider from '@material-ui/core/Divider';

import renderIf from 'render-if';

import { setError } from 'kpop/es/common/actions';
import TopBar from 'kpop/es/TopBar';
import { userShape } from 'kpop/es/shapes';
import AppsSwitcherButton from 'kpop/es/AppsGrid/AppsSwitcherButton';
import AppsSwitcherListItem from 'kpop/es/AppsGrid/AppsSwitcherListItem';
import { forceBase64URLEncoded, forceBase64StdEncoded } from 'kpop/es/utils';
import KopanoMeetIcon from 'kpop/es/icons/KopanoMeetIcon';
import debounce from 'kpop/es/utils/debounce';

import { fetchAndAddContacts } from '../actions/contacts';
import { addOrUpdateRecentsFromContact, addOrUpdateRecentsFromGroup } from '../actions/recents';
import {
  setLocalStream,
  unsetLocalStream,
  updateOfferAnswerConstraints,
  applyLocalStreamTracks,
  doCall,
  doHangup,
  doAccept,
  doReject,
  doGroup,
} from '../actions/kwm';
import {
  requestUserMedia,
  stopUserMedia,
  muteVideoStream,
  muteAudioStream,
  globalSettings as gUMSettings,
} from '../actions/usermedia';
import CallGrid from './CallGrid';
import IncomingCallDialog from './IncomingCallDialog';
import FullscreenDialog from './FullscreenDialog';
import Recents from './Recents';
import ContactSearch from './ContactSearch';
import BackdropOverlay from './BackdropOverlay';
import GroupControl from './GroupControl';
import NewPublicGroup from './NewPublicGroup';
import RTCStats from './RTCStats';
import { Howling } from './howling';


// NOTE(longsleep): Poor mans check if on mobile.
const isMobile = /Mobi/.test(navigator.userAgent);
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints;
const xsHeightDownBreakpoint = '@media (max-height:450px)';
const minimalHeightDownBreakpoint = '@media (max-height:275px)';
console.info('Is mobile', isMobile); // eslint-disable-line no-console
console.info('Is touch device', isTouchDevice); // eslint-disable-line no-console

const styles = theme => ({
  root: {
    flex: 1,
    display: 'flex',
    position: 'relative',
    flexDirection: 'column',
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
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  topBar: {
  },
  topBarHidden: {
    opacity: 0,
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
    top: theme.spacing.unit * 12,
    zIndex: theme.zIndex.drawer - 1,
    display: 'flex',
    flexDirection: 'column',
    '& > *': {
      marginBottom: theme.spacing.unit * 2,
    },
    opacity: 0.7,
    [theme.breakpoints.down('xs')]: {
      left: theme.spacing.unit,
      transform: 'scale(.8, .8)',
    },
    [xsHeightDownBreakpoint]: {
      transform: 'scale(.8, .8)',
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
  rtcStats: {
    position: 'absolute',
    left: theme.spacing.unit * 3,
    bottom: 0,
    fontSize: 10,
    fontFamily: theme.typography.fontFamily,
    color: 'white',
    textShadow: '0px 1px 3px rgba(0, 0, 0, 0.3)',
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
  tabs: {
  },
  tab: {
    maxWidth: 90,
    minWidth: 90,
  },
  menuContainer: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  mainView: {
    margin: '10px auto 0 auto',
    maxWidth: 450,
    width: '100%',
    minWidth: 300,
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
  searchButton: {
    display: 'none',
  },
  drawerPaper: {
    width: 300,
    height: 'auto',
    position: 'absolute',
    top: 64,
    bottom: 0,
    paddingTop: 1,
    [theme.breakpoints.down('sm')]: {
      top: 56,
    },
  },
});

class CallView extends React.PureComponent {
  rum = null;
  localStreamID = 'callview-main';

  constructor(props) {
    super(props);

    this.state = {
      mode: props.hidden ? 'standby' : 'videocall',
      wasTouched: false,
      withChannel: false,
      muteCam: false,
      muteMic: false,
      openDialogs: {},
      openMenu: false,
      openTab: 'recents',
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
    const { mode, muteCam, muteMic, withChannel } = this.state;
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
        } else if (!channel && mode !== 'videocall') {
          // Always restore to videocall mode when not in a call.
          this.setState({
            mode: 'videocall',
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

    if (channel && !prevProps.channel && !withChannel) {
      // Have a channel now.
      setTimeout(() => {
        if (this.props.channel) {
          this.setState({
            withChannel: true,
          });
        }
      }, 5000);
    } else if (!channel && withChannel) {
      // No channel.
      this.setState({
        withChannel: false,
      });
    }
  }

  componentWillUnmount() {
    const { doHangup } = this.props;

    this.closeAllOpenDialogs();
    doHangup();

    this.stopUserMedia();
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

  handleContactClick = (id, mode) => {
    const { doCall, addOrUpdateRecentsFromContact, localAudioVideoStreams } = this.props;

    const localStream = localAudioVideoStreams[this.localStreamID];
    this.wakeFromStandby(mode).then(() => {
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

  handleRecentEntryClick = (entry, kind, mode) => {
    if (!entry.id) {
      console.warn('invalid recent entry clicked', entry); // eslint-disable-line no-console
      return;
    }

    switch (kind) {
      case 'group':
        this.doViewGroup(entry.id, entry.scope);
        break;

      default:
        // Default is contacts.
        this.handleContactClick(entry.id, mode);
        break;
    }
  };

  handleGroupEntryClick = (id, scope, mode) => {
    const { doGroup, addOrUpdateRecentsFromGroup, localAudioVideoStreams } = this.props;

    const localStream = localAudioVideoStreams[this.localStreamID];
    this.wakeFromStandby(mode).then(() => {
      if (localStream && localStream.active) {
        return;
      }
      return this.requestUserMedia();
    }).then(() => {
      addOrUpdateRecentsFromGroup(id, scope);

      doGroup(`${scope}/${id}`);
    });
  }

  handleFabClick = () => {
    this.openDialog({ newCall: true});
  };

  handleAcceptClick = (id, mode) => {
    const  { doAccept, addOrUpdateRecentsFromContact, localAudioVideoStreams } = this.props;

    const localStream = localAudioVideoStreams[this.localStreamID];
    this.closeAllOpenDialogs();
    this.wakeFromStandby(mode).then(() => {
      if (localStream && localStream.active) {
        return;
      }
      return this.requestUserMedia();
    }).then(() => {
      // XXX(longsleep): Remove Base64 conversion once kwmserverd/konnectd is
      // updated to use URL-safe ids which is required since contact IDs come
      // from the REST API which is Base64 encoded while konnect requires the
      // IDs in Standard encoding.
      addOrUpdateRecentsFromContact(forceBase64URLEncoded(id));

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

  handleMenuAnchorClick = () => {
    const { openMenu } = this.state;

    this.setState({
      openMenu: !openMenu,
    });
  }

  handleDialogActionClick = (action, props) => {
    switch (action) {
      case 'new-public-group':
        this.openDialog({
          newPublicGroup: true,
        });
        break;

      case 'view-public-group':
        this.doViewGroup(props.id, props.scope);
        break;

      default:
        console.warn('unknown dialog action', action, props); // eslint-disable-line no-console
        break;
    }
  }

  handleTabChange = (event, value) => {
    this.setState({
      openTab: value,
    });
  }

  doViewGroup = (id, scope) => {
    const { history, addOrUpdateRecentsFromGroup } = this.props;

    history.push(`/r/${scope}/${id}`);
    addOrUpdateRecentsFromGroup(id, scope);
  }

  wakeFromStandby = (newMode) => {
    const { mode, muteCam } = this.state;

    return new Promise((resolve) => {
      newMode = newMode ? newMode : (muteCam ? 'call' : 'videocall');
      if (mode !== newMode) {
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

    if (this.rum) {
      this.rum.cancel();
      this.rum = null;
    }

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

    // Request user media with reference to allow cancel.
    const rum = debounce(requestUserMedia, 500)(this.localStreamID, video, audio);
    this.rum = rum;

    // Response actions.
    return rum.catch(err => {
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

  stopUserMedia = () => {
    const { stopUserMedia } = this.props;

    if (this.rum) {
      this.rum.cancel();
      this.rum = null;
    }

    stopUserMedia(this.localStreamID);
  }

  render() {
    const {
      classes,
      profile,
      channel,
      ringing,
      calling,
      localAudioVideoStreams,
      remoteStreams,
      connected,
    } = this.props;
    const { mode, muteCam, muteMic, wasTouched, withChannel, openDialogs, openMenu, openTab } = this.state;

    const callClassName = classNames(
      classes.call,
      {
        [classes.callWithCall]: !!channel,
      },
    );

    let controls = [];
    let icons = [];
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
    const topBarClassName = classNames(
      classes.topBar,
      {
        [classes.topBarHidden]: !!channel,
      }
    );
    const controlsMiddleClassName = classNames(
      classes.controlsMiddle,
      {
        [classes.controlsMiddleHidden]: !!channel && withChannel,
      }
    );

    controls.push(
      <div key='permanent' className={controlsPermanentClassName}>
        {muteCamButton}
        {muteMicButton}
      </div>
    );

    icons.push(
      <Hidden smDown key='kopano-apps'>
        <AppsSwitcherButton/>
      </Hidden>
    );

    if (!connected) {
      icons.unshift(
        <Tooltip title="No connection - check your internet connection." key="offline-icon" >
          <OfflineIcon color="error"/>
        </Tooltip>
      );
    }

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
          <RTCStats className={classes.rtcStats}/>
        </div>
      );
    } else {

      menu = (
        <div className={classes.menu}>
          {renderIf(mode === 'videocall' || mode === 'call' || mode === 'standby')(() => (
            <div className={classes.menuContainer}>
              <Switch>
                <Route exact path="/r/call" render={() => (
                  <React.Fragment>
                    <Tabs
                      value={openTab}
                      className={classes.tabs}
                      indicatorColor="primary"
                      textColor="primary"
                      onChange={this.handleTabChange}
                      centered
                    >
                      <Tab value="recents" className={classes.tab} icon={<HistoryIcon />} />
                      <Tab value="people" className={classes.tab} icon={<PeopleIcon />} />
                    </Tabs>
                    { openTab === 'recents' ?
                      <Recents
                        className={classes.mainView}
                        onEntryClick={this.handleRecentEntryClick}
                        onCallClick={this.handleFabClick}
                      /> :
                      <ContactSearch
                        className={classes.mainView}
                        onContactClick={(id, mode) => {
                          this.handleContactClick(id, mode);
                          this.openDialog({newCall: false});
                        }}
                        onActionClick={(action) => {
                          this.handleDialogActionClick(action);
                        }}
                        embedded
                      ></ContactSearch>
                    }
                    <Button
                      variant="fab"
                      className={classes.fab}
                      aria-label="add"
                      color="primary"
                      onClick={this.handleFabClick}
                    >
                      <AddCallIcon />
                    </Button>
                  </React.Fragment>
                )}/>
                <Route exact
                  path="/r/:scope(conference|group)/:id(.*)?"
                  render={({ match, ...other }) => {
                    return <GroupControl
                      className={classes.mainView}
                      onEntryClick={this.handleGroupEntryClick}
                      group={{
                        scope: match.params.scope,
                        id: match.params.id,
                      }}
                      {...other}/>;
                  }}
                />
                <Redirect to="/r/call"/>
              </Switch>
            </div>
          ))}
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
          onAcceptClick={(mode) => { this.handleAcceptClick(record.id, mode); }}
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
        <ContactSearch
          onContactClick={(id, mode) => {
            this.handleContactClick(id, mode);
            this.openDialog({newCall: false});
          }}
          onActionClick={(action) => {
            this.handleDialogActionClick(action);
          }}
        ></ContactSearch>
      </FullscreenDialog>
    );

    dialogs.push(
      <FullscreenDialog
        key="new-public-group"
        topTitle="Public group"
        topElevation={0}
        open={openDialogs.newPublicGroup || false}
        onClose={() => { this.openDialog({newPublicGroup: false}); }}
      >
        <NewPublicGroup
          onActionClick={(action, props) => {
            this.handleDialogActionClick(action, props);
            this.closeAllOpenDialogs();
          }}
        ></NewPublicGroup>
      </FullscreenDialog>
    );

    const localStream = localAudioVideoStreams[this.localStreamID];
    return (
      <div className={rootClassName}>
        <TopBar
          className={topBarClassName}
          title="Meet"
          appLogo={<KopanoMeetIcon alt="Kopano"/>}
          onAnchorClick={this.handleMenuAnchorClick}
          user={profile}
        >
          {icons}
          <IconButton disabled className={classes.searchButton}>
            <SearchIcon/>
          </IconButton>
        </TopBar>
        <Drawer
          variant="persistent"
          open={openMenu}
          classes={{
            paper: classes.drawerPaper,
          }}>
          <Divider />
          <List>
            <ListItem button disabled>
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItem>
            <Hidden mdUp>
              <AppsSwitcherListItem/>
            </Hidden>
          </List>
        </Drawer>
        <BackdropOverlay open={openMenu} onClick={this.handleMenuAnchorClick}></BackdropOverlay>
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

  history: PropTypes.object.isRequired,

  hidden: PropTypes.bool.isRequired,
  profile: userShape.isRequired,

  connected: PropTypes.bool.isRequired,
  channel: PropTypes.string,
  ringing: PropTypes.object.isRequired,
  calling: PropTypes.object.isRequired,

  fetchContacts: PropTypes.func.isRequired,
  requestUserMedia: PropTypes.func.isRequired,
  stopUserMedia: PropTypes.func.isRequired,
  doCall: PropTypes.func.isRequired,
  doHangup: PropTypes.func.isRequired,
  doAccept: PropTypes.func.isRequired,
  doReject: PropTypes.func.isRequired,
  doGroup: PropTypes.func.isRequired,
  muteVideoStream: PropTypes.func.isRequired,
  muteAudioStream: PropTypes.func.isRequired,
  updateOfferAnswerConstraints: PropTypes.func.isRequired,
  applyLocalStreamTracks: PropTypes.func.isRequired,
  setLocalStream: PropTypes.func.isRequired,
  unsetLocalStream: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
  addOrUpdateRecentsFromContact: PropTypes.func.isRequired,
  addOrUpdateRecentsFromGroup: PropTypes.func.isRequired,

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
      return dispatch(fetchAndAddContacts());
    },
    requestUserMedia: (id='', video=true, audio=true) => {
      return dispatch(requestUserMedia(id, video, audio));
    },
    stopUserMedia: (id='') => {
      return dispatch(stopUserMedia(id));
    },
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
    doGroup: (id) => {
      return dispatch(doGroup(id));
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
    addOrUpdateRecentsFromGroup: (id, scope) => {
      return dispatch(addOrUpdateRecentsFromGroup(id, scope));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles, {withTheme: true})(CallView));
