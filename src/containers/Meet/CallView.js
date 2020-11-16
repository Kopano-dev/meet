import React from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Redirect, Route, Switch } from 'react-router-dom';

import { withStyles, useTheme } from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import CallIcon from '@material-ui/icons/Call';
import ContactsIcon from '@material-ui/icons/Contacts';
import Button from '@material-ui/core/Button';
import HangupIcon from '@material-ui/icons/CallEnd';
import red from '@material-ui/core/colors/red';
import green from '@material-ui/core/colors/green';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import Tooltip from '@material-ui/core/Tooltip';
import AddCallIcon from 'mdi-material-ui/PhonePlus';
import OfflineIcon from 'mdi-material-ui/LanDisconnect';
import Divider from '@material-ui/core/Divider';
import ScreenShareIcon from '@material-ui/icons/ScreenShare';
import Fab from '@material-ui/core/Fab';
import useMediaQuery from '@material-ui/core/useMediaQuery';

import renderIf from 'render-if';

import { injectIntl, intlShape, defineMessages, FormattedMessage } from 'react-intl';

import TopBar from 'kpop/es/TopBar';
import TopBarBound from 'kpop/es/TopBar/TopBarBound';
import { userShape } from 'kpop/es/shapes';
import AppsSwitcherButton from 'kpop/es/AppsGrid/AppsSwitcherButton';
import AppsSwitcherListItem from 'kpop/es/AppsGrid/AppsSwitcherListItem';
import KopanoMeetIcon from 'kpop/es/icons/KopanoMeetIcon';
import MasterButton from 'kpop/es/MasterButton/MasterButton';
import AsideBar from 'kpop/es/AsideBar';
import { enqueueSnackbar, closeSnackbar } from 'kpop/es/common/actions';
import { writeTextToClipboard } from 'kpop/es/clipboard';

import { isGroupChannel } from '../../utils';
import { fetchAndAddContacts, initializeContactsWithRecents } from '../../actions/contacts';
import { fetchRecents } from '../../actions/recents';
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
} from '../../actions/meet';
import { getStreamsByType } from '../../selectors/streams';
import Howling from '../../components/Howling';
import { isMobile, isTouchDevice } from '../../utils';
import FullscreenDialog from '../../components/FullscreenDialog';
import AutoStandby from '../../components/AutoStandby';
import QuickSettingsList from '../../components/QuickSettingsList';
import FabWithProgress from '../../components/FabWithProgress';
import FloatingCamMuteButton from '../../components/FloatingCamMuteButton';
import FloatingMicMuteButton from '../../components/FloatingMicMuteButton';
import SettingsButton from '../../components/SettingsButton';
import SettingsList from '../../components/SettingsList';

import CallGrid from './CallGrid';
import IncomingCallDialog from './IncomingCallDialog';
import Recents from './Recents';
import ContactSearch from './ContactSearch';
import Invite from './Invite';
import BackdropOverlay from './BackdropOverlay';
import GroupControl from './GroupControl';
import ContactControl from './ContactControl';
import NewPublicGroup from './NewPublicGroup';
import RTCStats from './RTCStats';

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
    [theme.breakpoints.meet.desktopWidth]: {
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
  flexDirectionRow: {
    [theme.breakpoints.up('md')]: {
      flexDirection: 'row',
    },
  },
  topBar: {
  },
  topBarHidden: {
    opacity: 0,
  },
  controls: {
    height: 0,
  },
  wrappedButton: {
    position: 'relative',
  },
  fabProgress: {
    color: green[500],
    position: 'absolute',
    top: -6,
    left: -6,
    zIndex: 1,
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
  callWithCall: {
    flex: 1,
    transform: 'rotateY(0deg)',
  },
  callAsSidebar: {
    [theme.breakpoints.meet.desktopWidth]: {
      flex: 'auto',
      maxWidth: 135,
      height: 'auto',
      backgroundColor: theme.videoBackground.bottom,
      paddingBottom: 130 + theme.spacing(2),
    },
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
          display: 'none',
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
  tabs: {
    borderTop: '1px solid #eee',
    borderBottom: '1px solid #eee',
  },
  tab: {
    fontSize: '0.7em',
  },
  menuContainer: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  mainView: {
    flex: 1,
    minWidth: 300,
  },
  contactSearchView: {
    background: 'white',
    paddingTop: 10 + theme.spacing(1),
    [theme.breakpoints.meet.minimalHeightDown]: {
      paddingTop: 0,
    },
  },
  fab: {
    position: 'absolute',
    zIndex: theme.zIndex.drawer - 1,
    bottom: theme.spacing(4),
    right: theme.spacing(3),
  },
  searchButton: {
    display: 'none',
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
  dialog: {
    [theme.breakpoints.up('md')]: {
      height: '60%',
      width: '80vw',
      maxHeight: 600,
      minHeight: 340,
      minWidth: 480,
    },
  },
  masterButton: {
    margin: `${theme.spacing(2)}px 24px`,
  },
});

const translations = defineMessages({
  audioIsMutedSnack: {
    id: 'callView.audioIsMutedSnack.message',
    defaultMessage: 'Audio playback is muted.',
  },
  microphoneIsMutedSnack: {
    id: 'callView.microphoneIsMutedSnack.message',
    defaultMessage: 'Your microphone is muted.',
  },
  noConnectionTooltipTitle: {
    id: 'callView.noConnectionTooltip.title',
    defaultMessage: 'No connection - check your Internet connection.',
  },
  tabLabelCalls: {
    id: 'callView.tabCalls.label',
    defaultMessage: 'Calls',
  },
  tabLabelContacts: {
    id: 'callView.tabContacts.label',
    defaultMessage: 'Contacts',
  },
  fabButtonAriaLabel: {
    id: 'callView.fabButton.aria',
    defaultMessage: 'add',
  },
  masterButtonLabel: {
    id: 'callView.masterButton.label',
    defaultMessage: 'New call',
  },
  newCallDialogTopTitle: {
    id: 'callView.newCallDialog.topTitle',
    defaultMessage: 'New call',
  },
  newPublicGroupDialogTopTitle: {
    id: 'callView.newPublicGroupDialog.topTitle',
    defaultMessage: 'Join or create group',
  },
  inviteDialogTopTitle: {
    id: 'callView.inviteDialog.topTitle',
    defaultMessage: 'Invite to "{id}"',
  },
  copiedLinkToClipboardSnack: {
    id: 'callView.copiedLinkToClipboard.snack',
    defaultMessage: 'Link copied to clipboard.',
  },
  inviteByMailtoSnack: {
    id: 'callView.inviteByMailTo.snack',
    defaultMessage: 'Invitation email created, opening your mail program now.',
  },
  inviteShareLinkSubject: {
    id: 'callView.inviteByShareLink.subject.template',
    defaultMessage: 'Invitation to "{id}"',
  },
  inviteShareLinkText: {
    id: 'callView.inviteByShareLink.text.template',
    defaultMessage: 'You can join this meeting from your computer, tablet or smartphone.\n\n',
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
      openDialogs: {},
      openTab: 'recents',
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
    const { isMobile } = this.props;
    const { sidebarOpen, sidebarMobileOpen } = this.state;

    const update = {};
    if (isMobile) {
      // Mobile sid bar.
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

  handleTabChange = (event, value) => {
    this.setState({
      openTab: value,
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
      remoteAudioVideoStreams,
      remoteScreenshareStreams,
      connected,
      gDMSupported,
      audioSinkId,
      dmPending,
      intl,
      theme,
    } = this.props;
    const { shareScreen, wasTouched, withChannel, openDialogs, sidebarOpen, sidebarMobileOpen, openTab } = this.state;

    const anchor = theme.direction === 'rtl' ? 'right' : 'left';

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
      <div className={menuClassName}>
        {renderIf(mode === 'videocall' || mode === 'call' || mode === 'standby')(() => (
          <div className={classes.menuContainer}>
            <Switch>
              <Route exact path="/r/call" render={() => (
                <React.Fragment>
                  <Hidden smDown>
                    <MasterButton icon={<AddCallIcon />} onClick={this.handleFabClick} className={classes.masterButton}>
                      {intl.formatMessage(translations.masterButtonLabel)}
                    </MasterButton>
                  </Hidden>
                  <Tabs
                    value={openTab}
                    className={classes.tabs}
                    indicatorColor="primary"
                    textColor="primary"
                    onChange={this.handleTabChange}
                    centered
                    variant="fullWidth"
                  >
                    <Tab value="recents" className={classes.tab} icon={<CallIcon />} label={intl.formatMessage(translations.tabLabelCalls)} />
                    <Tab value="people" className={classes.tab} icon={<ContactsIcon />} label={intl.formatMessage(translations.tabLabelContacts)} />
                  </Tabs>
                  { openTab === 'recents' ?
                    <Recents
                      className={classes.mainView}
                      onEntryClick={this.handleEntryClick}
                      onCallClick={this.handleFabClick}
                    /> :
                    <ContactSearch
                      className={classNames(classes.mainView, classes.contactSearchView)}
                      onEntryClick={(...args) => {
                        this.handleEntryClick(...args);
                        this.openDialog({newCall: false});
                      }}
                      onActionClick={(action) => {
                        this.handleDialogActionClick(action);
                      }}
                      embedded
                    ></ContactSearch>
                  }
                  <Hidden smUp>
                    <Fab
                      className={classes.fab}
                      aria-label={intl.formatMessage(translations.fabButtonAriaLabel)}
                      color="primary"
                      onClick={this.handleFabClick}
                    >
                      <AddCallIcon />
                    </Fab>
                  </Hidden>
                </React.Fragment>
              )}/>
              <Route exact
                path="/r/call/:id(.*)"
                render={({ match, location, ...other }) => {
                  const { entry } = location.state ? location.state : {};
                  if (!entry || entry.id !== match.params.id) {
                    return <Redirect to="/r/call"/>;
                  }
                  return <ContactControl
                    className={classes.mainView}
                    onEntryClick={this.handleEntryClick}
                    entry={entry}
                    channel={channel}
                    ts={ts}
                    {...other}
                  />;
                }}
              />
              <Route exact
                path="/r/:scope(conference|group)/:id(.*)?"
                render={({ match, ...other }) => {
                  const group = {
                    scope: match.params.scope,
                    id: match.params.id,
                  };

                  return <GroupControl
                    className={classes.mainView}
                    onEntryClick={this.handleEntryClick}
                    onActionClick={(action, props) => {
                      this.handleDialogActionClick(action, props);
                    }}
                    channel={channel}
                    ts={ts}
                    group={group}
                    config={config}
                    {...other}
                  >
                    <FullscreenDialog
                      topTitle={intl.formatMessage(translations.inviteDialogTopTitle, {id: group.id})}
                      topElevation={0}
                      responsive
                      disableBackdropClick
                      PaperProps={{
                        className: classes.dialog,
                      }}
                      open={openDialogs.invite || false}
                      onClose={() => { this.openDialog({invite: false}); }}
                    >
                      <Invite
                        group={group}
                        onActionClick={(action, props) => {
                          this.handleDialogActionClick(action, props);
                        }}
                        config={config}
                      />
                    </FullscreenDialog>
                  </GroupControl>;
                }}
              />
            </Switch>
          </div>
        ))}
      </div>
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
        PaperProps={{
          className: classes.dialog,
        }}
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
        PaperProps={{
          className: classes.dialog,
        }}
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

    const drawer = <React.Fragment>
      <Hidden smDown>
        {menu}
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
          <div className={containerClassName}>
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
              remoteStreams={remoteAudioVideoStreams}
              variant={screenShareViewer ? 'overlay': 'full'}
              audioSinkId={audioSinkId}
              AudioVideoProps={{
                className: callAudioVideoClassName,
              }}
            />
            <Hidden mdUp>{menu}</Hidden>
          </div>
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
  isMobile: PropTypes.bool.isRequired,

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
  const { guest, auto, muteMic, mode, muted, cover, localStream } = state.meet;
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

const withMobile = Component => {
  return function useWithMobile(props) {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    return <Component theme={theme} isMobile={!isDesktop} {...props}></Component>;
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(withMobile(injectIntl(CallView))));
