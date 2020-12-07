import React from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import Button from '@material-ui/core/Button';
import HangupIcon from '@material-ui/icons/CallEnd';
import red from '@material-ui/core/colors/red';
import green from '@material-ui/core/colors/green';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import Tooltip from '@material-ui/core/Tooltip';
import OfflineIcon from 'mdi-material-ui/LanDisconnect';
import Divider from '@material-ui/core/Divider';
import ScreenShareIcon from '@material-ui/icons/ScreenShare';
import Fab from '@material-ui/core/Fab';

import renderIf from 'render-if';

import { injectIntl, intlShape, FormattedMessage } from 'react-intl';

import { ReflexContainer, ReflexElement, ReflexHandle, ReflexSplitter } from 'react-reflex';

import TopBar from 'kpop/es/TopBar';
import TopBarBound from 'kpop/es/TopBar/TopBarBound';
import { userShape } from 'kpop/es/shapes';
import AppsSwitcherButton from 'kpop/es/AppsGrid/AppsSwitcherButton';
import AppsSwitcherListItem from 'kpop/es/AppsGrid/AppsSwitcherListItem';
import KopanoMeetIcon from 'kpop/es/icons/KopanoMeetIcon';
import AsideBar from 'kpop/es/AsideBar';
import { enqueueSnackbar, closeSnackbar } from 'kpop/es/common/actions';
import { writeTextToClipboard } from 'kpop/es/clipboard';

import { getAudioContext } from '../../../base';
import { isGroupChannel } from '../../../utils';
import { fetchAndAddContacts, initializeContactsWithRecents } from '../../../actions/contacts';
import { fetchRecents } from '../../../actions/recents';
import {
  doAccept,
  doHangup,
  doReject,
  doIgnore,
  doCall,
  requestDisplayMedia,
  stopDisplayMedia,
  doMuteOrUnmute,
  doViewContact,
  doViewGroup,
  updateOfferAnswerConstraints,
  SCREENSHARE_SCREEN_ID,
} from '../../../actions/meet';
import { getStreamsByType } from '../../../selectors/streams';
import Howling from '../../../components/Howling';
import { isMobile, isTouchDevice } from '../../../utils';
import FullscreenDialog from '../../../components/FullscreenDialog';
import AutoStandby from '../../../components/AutoStandby';
import QuickSettingsList from '../../../components/QuickSettingsList';
import FabWithProgress from '../../../components/FabWithProgress';
import FloatingCamMuteButton from '../../../components/FloatingCamMuteButton';
import FloatingMicMuteButton from '../../../components/FloatingMicMuteButton';
import SettingsButton from '../../../components/SettingsButton';
import SettingsList from '../../../components/SettingsList';
import CollapseIcon from '../../../icons/Collapse';
import ExpandIcon from '../../../icons/Expand';

import CallGrid from '../CallGrid';
import IncomingCallDialog from '../IncomingCallDialog';
import BackdropOverlay from '../BackdropOverlay';
import NewPublicGroup from '../NewPublicGroup';
import RTCStats from '../RTCStats';
import ContactSearch from '../ContactSearch';

import translations from './translations';
import SwitchPanel from './SwitchPanel';
import SwitchDialogs from './SwitchDialogs';
import MobilePanel from './MobilePanel';

console.info('Is mobile', isMobile); // eslint-disable-line no-console
console.info('Is touch device', isTouchDevice); // eslint-disable-line no-console

const drawerWidth = 388;

const styles = theme => ({
  root: {
    flex: 1,
    display: 'flex',
    position: 'relative',
    flexDirection: 'column',
    minHeight: 0, // See https://bugzilla.mozilla.org/show_bug.cgi?id=1043520
  },
  rootWithHover: {
    '&:hover $controlsPermanentHidden, &:hover $controlsMiddleHidden': {
      opacity: 1,
    },
  },
  rootWasTouched: {
    '& $controlsPermanentHidden, & $controlsMiddleHidden': {
      opacity: 1,
    },
  },
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    minHeight: 0, // See https://bugzilla.mozilla.org/show_bug.cgi?id=1043520
    [theme.breakpoints.up('md')]: {
      flexDirection: 'row',
    },
  },
  content: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    minHeight: 0, // See https://bugzilla.mozilla.org/show_bug.cgi?id=1043520
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  'content-left': {
    [theme.breakpoints.up('md')]: {
      marginLeft: 0,
    },
  },
  'content-right': {
    [theme.breakpoints.up('md')]: {
      marginRight: 0,
    },
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  'contentShift-left': {
    [theme.breakpoints.up('md')]: {
      marginLeft: drawerWidth,
    },
  },
  'contentShift-right': {
    [theme.breakpoints.up('md')]: {
      marginRight: drawerWidth,
    },
  },
  topBar: {
  },
  controlsOuter: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    [theme.breakpoints.meet.xsHeightDown]: {
      minHeight: 65,
      height: '10vh',
    },
    [theme.breakpoints.meet.minimalHeightDown]: {
      minHeight: 0,
      height: 0,
    },
    [theme.breakpoints.up('md')]: {
      height: 'auto',
      flex: 1,
    },
  },
  controlsOuterWithCall: {
    flex: 1,
  },
  controls: {
    height: 0,
  },
  controlsMiddle: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: theme.spacing(4),
    zIndex: theme.zIndex.appBar + 1,
    display: 'flex',
    justifyContent: 'center',
    opacity: 1,
    [theme.breakpoints.down('xs')]: {
      transform: 'scale(.8, .8)',
    },
    [theme.breakpoints.meet.xsHeightDown]: {
      transform: 'scale(.8, .8)',
    },
    transition: theme.transitions.create('opacity', {
      easing: theme.transitions.easing.easeOut,
    }),
    '& > *': {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
  },
  controlsMiddleHidden: {
    opacity: 0,
  },
  controlsPermanent: {
    position: 'absolute',
    left: theme.spacing(2),
    bottom: theme.spacing(4),
    zIndex: theme.zIndex.drawer - 1,
    display: 'flex',
    flexDirection: 'column',
    '& > *': {
      marginTop: theme.spacing(2),
    },
    opacity: 1,
    [theme.breakpoints.down('xs')]: {
      transform: 'scale(.8, .8)',
    },
    [theme.breakpoints.meet.xsHeightDown]: {
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
  controlsOffset: {
    top: theme.spacing(2),
    bottom: 'auto',
    opacity: 0.5,
    [theme.breakpoints.up('md')]: {
      top: 'auto',
      bottom: theme.spacing(4),
      opacity: 1,
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
  shareScreenButtonActive: {
    backgroundColor: green[500],
    color: 'white',
    '&:hover': {
      backgroundColor: green[700],
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        backgroundColor: green[700],
      },
    },
  },
  rtcStats: {
    position: 'absolute',
    right: 4,
    bottom: -28,
    fontSize: 10,
    fontFamily: theme.typography.fontFamily,
    color: 'white',
    textShadow: '0px 1px 3px rgba(0, 0, 0, 0.3)',
    [theme.breakpoints.down('md')]: {
      bottom: -28 + theme.spacing(),
    },
  },
  call: {
    height: '20vh',
    minHeight: 100,
    overflow: 'hidden',
    boxSizing: 'border-box',
    perspective: 1000,
    transform: 'rotateY(360deg)',
    transition: theme.transitions.create('height, transform', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    flex: 1,
  },
  callWithCall: {
    transform: 'rotateY(0deg)',
  },
  callAsSidebar: {
    flex: 'auto',
    maxWidth: 135,
    height: 'auto',
    backgroundColor: theme.videoBackground.bottom,
    paddingBottom: 130 + theme.spacing(2),
    '& ::-webkit-scrollbar-track': {
      backgroundColor: 'transparent',
    },
    '& > div > div': {
      maxWidth: 112,
      maxHeight: 112,
    },
  },
  callAsSidebarAudioVideo: {
    '& > div': { // Good lord - terribe stuff follows!
      left: 2,
      right: 2,
      top: 'auto',
      bottom: 2,
      '& > h5': {
        fontSize: 10,
        marginBottom: 0,
        '& > svg': {
          fontSize: '1.6em',
        },
      },
    },
  },
  screenshare: {
    flex: 1,
    background: `linear-gradient(#999, #666 100%)`,
  },
  menu: {
    boxSizing: 'border-box',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0, // See https://bugzilla.mozilla.org/show_bug.cgi?id=1043520
  },
  menuWithCall: {
    [theme.breakpoints.down('sm')]: {
      flex: 0,
    },
  },
  menuContainer: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    background: theme.palette.background.default,
  },
  navDrawer: {
  },
  drawerPaper: {
    width: 280,
    height: 'auto',
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: theme.palette.background.default,
    [theme.breakpoints.up('md')]: {
      width: drawerWidth,
      top: 1,
      paddingTop: 1,
    },
  },
  flexDirectionRow: {
    flexDirection: 'row',
  },
  reflexSplitter: {
    height: 0,
  },
  forceFlex: {
    flex: '1 !important',
  },
  mobilePanel: {
    position: 'relative',
    marginTop: -8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  mobilePanelHandle: {
    height: 70,
    width: 48,
    position: 'absolute',
    left: '50%',
    marginLeft: -24,
    zIndex: 1,
    textAlign: 'center',
    '& > svg': {
      fontSize: '2rem',
      pointerEvents: 'none',
    },
  },
});

class CallView extends React.PureComponent {
  constructor(props) {
    super(props);

    const { auto, channel } = props;

    // Initialize state.
    this.state = {
      wasTouched: false,
      withChannel: false,
      shareScreen: false,
      sidebarOpen: isGroupChannel(channel) || (!auto && !channel),
      sidebarMobileOpen: false,
      bottombarMobileExpanded: false,
      openDialogs: {},
    };

    this.touchedTimer = null;

    this.settingsMenuRef = React.createRef();
  }

  componentDidMount() {
    const {
      fetchContacts,
      fetchRecents,
      initializeContactsWithRecents,
      updateOfferAnswerConstraints,
      muted,
      enqueueSnackbar,
      closeSnackbar,
    } = this.props;
    fetchContacts().catch(err => {
      // Ignore errors here, let global handler do it.
      console.error('failed to fetch contacts', err); // eslint-disable-line no-console
    });
    fetchRecents().then(recents => {
      if (recents !== null) {
        return initializeContactsWithRecents();
      }
    }).catch(err => {
      console.error('failed to fetch recents', err); // eslint-disable-line no-console
    });

    updateOfferAnswerConstraints();

    // TODO(longsleep): The initial rum should ensure, that the selected audioSink
    // actually has permission. This right now means that the mic of the corresponding
    // device needs to be requested. See https://w3c.github.io/mediacapture-output/#privacy-considerations

    if (muted) {
      enqueueSnackbar({
        message: translations.audioIsMutedSnack,
        options: {
          variant: 'info',
          key: 'callview_global_muted',
          persist: true,
          action: key => {
            return <Button
              size="small"
              onClick={() => {
                closeSnackbar(key);
                this.handleUnmuteClick();
              }}
            >
              <FormattedMessage id="callView.audioIsMutedSnack.button.text" defaultMessage="unmute"></FormattedMessage>
            </Button>;
          },
        },
      });
    }
  }

  componentDidUpdate(prevProps, /*prevState*/) {
    const {
      withChannel,
      shareScreen,
    } = this.state;
    const {
      muteMic,
      channel,
      stopDisplayMedia,
      enqueueSnackbar,
      closeSnackbar,
    } = this.props;

    if (channel && !prevProps.channel && !withChannel) {
      // Have a channel now.
      setTimeout(() => {
        if (this.props.channel) {
          this.setState({
            withChannel: true,
          });
        }
      }, 5000);

      this.setState({
        sidebarOpen: isGroupChannel(channel),
      });
      if (muteMic) {
        enqueueSnackbar({
          message: translations.microphoneIsMutedSnack,
          options: {
            variant: 'info',
            autoHideDuration: 10000,
            action: key => {
              return <Button
                size="small"
                onClick={() => {
                  closeSnackbar(key);
                  this.handleUnmuteMicClick();
                }}
              >
                <FormattedMessage id="callView.microphoneIsMutedSnack.button.text" defaultMessage="unmute"></FormattedMessage>
              </Button>;
            },
          },
        });
      }
    } else if (!channel && (withChannel || prevProps.channel)) {
      // No channel.
      this.setState({
        withChannel: false,
        sidebarOpen: true,
        shareScreen: false,
      });
      // Stop screen share.
      if (shareScreen) {
        Promise.resolve().then(stopDisplayMedia); // Delay this, so peer connections have a chance to get cleaned up.
      }
    }
  }

  componentWillUnmount() {
    const { doHangup, stopDisplayMedia } = this.props;

    this.closeAllOpenDialogs();
    doHangup();

    stopDisplayMedia();
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

  handleUnmuteMicClick = () => {
    const { doMuteOrUnmute } = this.props;

    doMuteOrUnmute({muteMic: false});
  }

  handleUnmuteClick = () => {
    const { doMuteOrUnmute } = this.props;

    const audioContext = getAudioContext();
    if (audioContext) {
      try {
        audioContext.resume();
      } catch(err) {};
    }

    doMuteOrUnmute({muteAudio: false});
  }

  handleShareScreenClick = state => () => {
    const { requestDisplayMedia, stopDisplayMedia } = this.props;

    if (state === undefined) {
      state = !this.state.shareScreen;
    }

    if (state) {
      requestDisplayMedia().then(stream => {
        if (stream) {
          stream.addEventListener('inactive', () => {
            // TODO(longsleep): This might not detect that the stream is old.
            this.setState({
              shareScreen: false,
            });
          }, true);
        } else {
          this.setState({
            shareScreen: false,
          });
        }
      });
    } else {
      stopDisplayMedia();
    }
    this.setState({
      shareScreen: state,
    });
  }

  handleEntryClick = (entry, kind, mode) => {
    const { doCall } = this.props;

    if (!entry.id) {
      console.warn('invalid entry data', entry); // eslint-disable-line no-console
      return;
    }

    doCall(entry, kind, mode);
  };

  handleFabClick = () => {
    this.openDialog({ newCall: true});
  };

  handleAcceptClick = (id, mode, entry, kind) => {
    const { doAccept } = this.props;

    doAccept(id, mode, entry, kind);
  }

  handleHangupClick = () => {
    const { doHangup } = this.props;

    doHangup();
  };

  handleRejectClick = (id) => {
    const { doReject } = this.props;

    doReject(id);
  }

  handleIgnoreClick = (id) => {
    const { doIgnore } = this.props;

    doIgnore(id);
  }

  handleSidebarToggle = () => {
    const { width } = this.props;
    const { sidebarOpen, sidebarMobileOpen } = this.state;

    const update = {};
    if (!isWidthUp('md', width)) {
      // Mobile side bar.
      update.sidebarMobileOpen = !sidebarMobileOpen;
    } else {
      // Desktop side bar.
      update.sidebarOpen = !sidebarOpen;
    }
    this.setState(update);
  }

  handleDialogActionClick = (action, props) => {
    const { intl, enqueueSnackbar } = this.props;

    switch (action) {
      case 'new-public-group':
        this.openDialog({
          newPublicGroup: true,
        });
        break;

      case 'view-public-group': {
        const { doViewGroup } = this.props;
        doViewGroup(props, { recents: true });
        break;
      }

      case 'share-link-click':
        if (navigator.share) {
          navigator.share({
            title: intl.formatMessage(translations.inviteShareLinkSubject, { id: props.id }),
            text: intl.formatMessage(translations.inviteShareLinkText, { id: props.id }),
            url: props.url,
          }).catch(err => console.warn('Error sharing', err)); // eslint-disable-line no-console
        } else {
          writeTextToClipboard(props.url).then(() => {
            enqueueSnackbar({
              message: translations.copiedLinkToClipboardSnack,
              options: { variant: 'info' },
            });
          }).catch(err => console.warn('Failed to copy link to clipboard', err)); // eslint-disable-line no-console
        }
        break;

      case 'invite-group':
        this.openDialog({
          invite: true,
        });
        break;

      case 'invite-by-mailto':
        enqueueSnackbar({
          message: translations.inviteByMailtoSnack,
          options: { variant: 'info' },
        });
        this.openDialog({
          invite: false,
        });
        break;

      default:
        console.warn('unknown dialog action', action, props); // eslint-disable-line no-console
        break;
    }
  }

  handleBottombarStopResize = () => {
    const { bottombarMobileExpanded } = this.state;

    this.setState({
      bottombarMobileExpanded: !bottombarMobileExpanded,
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

  render() {
    const {
      classes,
      profile,
      config,
      guest,
      mode,
      muted,
      cover,
      channel,
      ts,
      ringing,
      calling,
      localStream,
      localStreamTalking,
      remoteAudioVideoStreams,
      remoteScreenshareStreams,
      connected,
      gDMSupported,
      audioSinkId,
      dmPending,
      intl,
      theme,
      width,
    } = this.props;
    const { shareScreen, wasTouched, withChannel, openDialogs, sidebarOpen, sidebarMobileOpen, bottombarMobileExpanded } = this.state;

    const anchor = theme.direction === 'rtl' ? 'right' : 'left';

    const mdUp = isWidthUp('md', width);

    let controls = [];
    let icons = [];
    let menu = null;
    let dialogs = [];

    let muteCamButton = null;
    let muteMicButton = null;
    let shareScreenButton = null;
    let screenShareViewer = null;

    if (channel && mode === 'videocall' && remoteScreenshareStreams.length > 0) {
      screenShareViewer = <CallGrid
        onClick={this.handleCallGridClick}
        className={classes.screenshare}
        remoteStreams={remoteScreenshareStreams}
        remoteStreamsKey={`stream_screenshare_${SCREENSHARE_SCREEN_ID}`}
        muted
        mode={mode}
        cover={false}
        labels={false}
        variant="full"
        channel={channel}
      />;
    }

    if (mode === 'videocall' || mode === 'standby') {
      muteCamButton = <FloatingCamMuteButton className={classes.muteCamButton}/>;
      shareScreenButton = (!isMobile && gDMSupported) && <FabWithProgress
        color="inherit"
        className={classNames(
          classes.shareScreenButton,
          {
            [classes.shareScreenButtonActive]: shareScreen,
          }
        )}
        onClick={this.handleShareScreenClick()}
        pending={dmPending}
      >
        <ScreenShareIcon />
      </FabWithProgress>;
    }

    if (mode === 'videocall' || mode === 'call' || mode === 'standby') {
      muteMicButton = <FloatingMicMuteButton className={classes.muteMicButton}/>;
    }

    const containerClassName = classNames(
      classes.container,
      {
      }
    );

    const controlsOuterClassName = classNames(
      classes.controlsOuter,
      {
        [classes.controlsOuterWithCall]: !!channel,
        [classes.flexDirectionRow]: !!screenShareViewer,
      }
    );

    const callClassName = classNames(
      classes.call,
      {
        [classes.callWithCall]: !!channel,
        [classes.callAsSidebar]: !!screenShareViewer,
      },
    );

    const callAudioVideoClassName = classNames(
      classes.callAudioVideo,
      {
        [classes.callAsSidebarAudioVideo]: !!screenShareViewer,
      }
    );

    const menuClassName = classNames(
      classes.menu,
      {
        [classes.menuWithCall]: !!channel,
      },
    );

    const rootClassName = classNames(
      classes.root,
      {
        [classes.rootWithHover]: !isTouchDevice || !isMobile,
        [classes.rootWasTouched]: wasTouched,
      },
    );
    const controlsPermanentClassName = classNames(
      classes.controlsPermanent,
      {
        [classes.controlsPermanentStandby]: mode === 'standby',
        [classes.controlsPermanentHidden]: !!channel,
        [classes.controlsOffset]: !channel,
      }
    );
    const topBarClassName = classNames(
      classes.topBar,
    );
    const controlsMiddleClassName = classNames(
      classes.controlsMiddle,
      {
        [classes.controlsMiddleHidden]: !!channel && withChannel,
        [classes.controlsOffset]: !channel,
      }
    );

    controls.push(
      <div key='permanent' className={controlsPermanentClassName}>
        {shareScreenButton}
      </div>
    );

    icons.push(
      <Hidden smDown key='settings'>
        <SettingsButton/>
      </Hidden>
    );

    if (!guest.user) {
      icons.push(
        <Hidden smDown key='kopano-apps'>
          <AppsSwitcherButton/>
        </Hidden>
      );
    }

    if (!connected) {
      icons.unshift(
        <Tooltip
          title={intl.formatMessage(translations.noConnectionTooltipTitle)}
          key="offline-icon"
        >
          <OfflineIcon color="error"/>
        </Tooltip>
      );
    }

    controls.push(
      <div key='middle' className={controlsMiddleClassName}>
        {muteCamButton}
        {muteMicButton}
        {channel && <Fab
          color="inherit"
          className={classes.hangupButton}
          onClick={this.handleHangupClick}
        >
          <HangupIcon />
        </Fab>}
        <RTCStats className={classes.rtcStats}/>
      </div>
    );

    menu = (
      <React.Fragment>
        {renderIf(mode === 'videocall' || mode === 'call' || mode === 'standby')(() => (
          <div className={classes.menuContainer}>
            <SwitchPanel
              config={config}
              onFabClick={this.handleFabClick}
              onEntryClick={this.handleEntryClick}
              onActionClick={this.handleDialogActionClick}
              openDialog={this.openDialog}
              openDialogs={openDialogs}
              ts={ts}
              channel={channel}
            />
          </div>
        ))}
      </React.Fragment>
    );

    for (const id in ringing) {
      const record = ringing[id];
      dialogs.push(
        <IncomingCallDialog
          open={!record.ignore}
          key={`incoming-call-${id}`}
          record={record}
          mode={mode}
          onAcceptClick={(mode, entry, kind) => { this.handleAcceptClick(record.id, mode, entry, kind); }}
          onRejectClick={(entry, kind) => { this.handleRejectClick(record.id, entry, kind); }}
          onIgnoreClick={() => { this.handleIgnoreClick(record.id); }}
        >
        </IncomingCallDialog>
      );
    }

    dialogs.push(
      <FullscreenDialog
        key="new-call"
        topTitle={intl.formatMessage(translations.newCallDialogTopTitle)}
        topElevation={0}
        responsive
        open={openDialogs.newCall || false}
        onClose={() => { this.openDialog({newCall: false}); }}
      >
        <ContactSearch
          onEntryClick={(...args) => {
            this.handleEntryClick(...args);
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
        topTitle={intl.formatMessage(translations.newPublicGroupDialogTopTitle)}
        topElevation={0}
        responsive
        open={openDialogs.newPublicGroup || false}
        onClose={() => { this.openDialog({newPublicGroup: false}); }}
      >
        <NewPublicGroup
          onActionClick={(action, props) => {
            this.handleDialogActionClick(action, props);
            this.closeAllOpenDialogs();
          }}
          config={config}
        ></NewPublicGroup>
      </FullscreenDialog>
    );

    dialogs.push(<SwitchDialogs
      key="switch-dialogs"
      config={config}
      onActionClick={this.handleDialogActionClick}
      openDialog={this.openDialog}
      openDialogs={openDialogs}
    />);

    const drawer = <React.Fragment>
      <Hidden smDown>
        <div className={menuClassName}>{menu}</div>
        <Divider/>
      </Hidden>
      <Hidden mdUp>
        <QuickSettingsList withIcons/>
        <SettingsList withIcons>
          <AppsSwitcherListItem/>
        </SettingsList>
      </Hidden>
    </React.Fragment>;

    return (
      <div className={rootClassName}>
        <TopBar
          className={topBarClassName}
          title="Meet"
          appLogo={<KopanoMeetIcon alt="Kopano"/>}
          onAnchorClick={this.handleSidebarToggle}
          profile={profile}
        >
          {icons}
        </TopBar>
        <Hidden mdUp>
          <Drawer
            variant="temporary"
            anchor={anchor}
            open={sidebarMobileOpen}
            classes={{
              paper: classes.drawerPaper,
            }}
            onClose={this.handleSidebarToggle}
          >
            {drawer}
          </Drawer>
          <BackdropOverlay open={sidebarMobileOpen}></BackdropOverlay>
        </Hidden>
        <Hidden smDown>
          <Drawer
            variant="persistent"
            anchor={anchor}
            open={sidebarOpen}
            className={classes.navDrawer}
            PaperProps={{
              component: TopBarBound,
            }}
            classes={{
              paper: classes.drawerPaper,
            }}
          >
            {drawer}
          </Drawer>
        </Hidden>
        <TopBarBound
          className={classNames(classes.content, classes[`content-${anchor}`], {
            [classes.contentShift]: sidebarOpen,
            [classes[`contentShift-${anchor}`]]: sidebarOpen,
          })}
        >
          <ReflexContainer
            className={containerClassName}
            orientation="horizontal"
          >
            <ReflexElement
              className={controlsOuterClassName}
            >
              <div className={classes.controls}>
                {controls}
              </div>
              {screenShareViewer}
              <CallGrid
                onClick={this.handleCallGridClick}
                className={callClassName}
                mode={mode}
                videoOnly={isGroupChannel(channel)}
                localStreamIsRemoteFallback={!channel}
                muted={muted}
                cover={cover}
                localStream={localStream}
                localStreamTalking={localStreamTalking}
                remoteStreams={remoteAudioVideoStreams}
                remoteTalkingDetection={!config.disableRemoteTalkingDetection}
                variant={screenShareViewer ? 'overlay': 'full'}
                audioSinkId={audioSinkId}
                AudioVideoProps={{
                  className: callAudioVideoClassName,
                }}
                channel={channel}
              />
            </ReflexElement>
            {!mdUp && <ReflexSplitter className={classes.reflexSplitter}/>}
            {!mdUp && <ReflexElement
              className={classNames(menuClassName, classes.mobilePanel, {[classes.forceFlex]: !channel})}
              minSize={72}
              size={bottombarMobileExpanded ? document.body.scrollHeight / 2 : 72}
              direction={-1}
              onStopResize={this.handleBottombarStopResize}
            >
              {channel && <ReflexHandle className={classes.mobilePanelHandle}>
                {bottombarMobileExpanded ? <CollapseIcon fontSize="large" color="inherit"/> : <ExpandIcon fontSize="large" color="inherit"/>}
              </ReflexHandle>}
              {!channel ? menu : <MobilePanel
                channel={channel}
                config={config}
                onActionClick={this.handleDialogActionClick}
              />}
            </ReflexElement>}
          </ReflexContainer>
          {!guest.user && <AsideBar/>}
        </TopBarBound>
        {dialogs}
        <Howling label="ring2" playing={Object.keys(ringing).length > 0} loop/>
        <Howling label="dial1" playing={Object.keys(calling).length > 0} interval={4}/>
        <AutoStandby wakeLock={!!channel}/>
      </div>
    );
  }
}

CallView.propTypes = {
  classes: PropTypes.object.isRequired,
  intl: intlShape.isRequired,

  theme: PropTypes.object.isRequired,
  width: PropTypes.string.isRequired,

  enqueueSnackbar: PropTypes.func.isRequired,
  closeSnackbar: PropTypes.func.isRequired,

  hidden: PropTypes.bool.isRequired,
  profile: userShape.isRequired,
  config: PropTypes.object.isRequired,
  guest: PropTypes.object.isRequired,
  auto: PropTypes.bool.isRequired,

  connected: PropTypes.bool,
  channel: PropTypes.string,
  ts: PropTypes.object,
  ringing: PropTypes.object.isRequired,
  calling: PropTypes.object.isRequired,

  muteMic: PropTypes.bool.isRequired,

  mode: PropTypes.string.isRequired,
  cover: PropTypes.bool.isRequired,
  muted: PropTypes.bool.isRequired,

  fetchContacts: PropTypes.func.isRequired,
  fetchRecents: PropTypes.func.isRequired,
  initializeContactsWithRecents: PropTypes.func.isRequired,
  requestDisplayMedia: PropTypes.func.isRequired,
  stopDisplayMedia: PropTypes.func.isRequired,
  doCall: PropTypes.func.isRequired,
  doHangup: PropTypes.func.isRequired,
  doAccept: PropTypes.func.isRequired,
  doReject: PropTypes.func.isRequired,
  doIgnore: PropTypes.func.isRequired,
  doViewContact: PropTypes.func.isRequired,
  doViewGroup: PropTypes.func.isRequired,
  doMuteOrUnmute: PropTypes.func.isRequired,
  updateOfferAnswerConstraints: PropTypes.func.isRequired,

  localStream: PropTypes.instanceOf(MediaStream),
  remoteAudioVideoStreams: PropTypes.array.isRequired,
  remoteScreenshareStreams: PropTypes.array.isRequired,

  gDMSupported: PropTypes.bool.isRequired,

  audioSinkId: PropTypes.string.isRequired,

  dmPending: PropTypes.bool.isRequired,
};

const mapStateToProps = state => {
  const { hidden, profile, config } = state.common;
  const { guest, auto, muteMic, mode, muted, cover, localStream, localStreamTalking } = state.meet;
  const { connected, channel, ts, ringing, calling } = state.kwm;
  const {
    gDMSupported,
    audioSinkId,
    dmPending,
  } = state.media;

  const { remoteAudioVideoStreams, remoteScreenshareStreams } = getStreamsByType(state);

  return {
    hidden,
    profile,
    config,
    guest,
    auto: !!auto,

    connected,
    channel,
    ts,
    ringing,
    calling,

    muteMic,

    mode,
    muted,
    cover,

    localStream,
    localStreamTalking,
    remoteAudioVideoStreams,
    remoteScreenshareStreams,

    gDMSupported,

    audioSinkId,

    dmPending,
  };
};

const mapDispatchToProps = dispatch => bindActionCreators({
  fetchContacts: fetchAndAddContacts,
  fetchRecents,
  initializeContactsWithRecents,
  requestDisplayMedia,
  stopDisplayMedia,
  doCall,
  doHangup,
  doAccept,
  doReject,
  doIgnore,
  doViewContact,
  doViewGroup,
  doMuteOrUnmute,
  updateOfferAnswerConstraints,
  enqueueSnackbar,
  closeSnackbar,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles, {withTheme: true})(withWidth()(injectIntl(CallView))));
