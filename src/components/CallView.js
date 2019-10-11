import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Redirect, Route, Switch } from 'react-router-dom';

import { withStyles } from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import CallIcon from '@material-ui/icons/Call';
import ContactsIcon from '@material-ui/icons/Contacts';
import MicIcon from '@material-ui/icons/Mic';
import MicOffIcon from '@material-ui/icons/MicOff';
import CamIcon from '@material-ui/icons/Videocam';
import CamOffIcon from '@material-ui/icons/VideocamOff';
import Button from '@material-ui/core/Button';
import HangupIcon from '@material-ui/icons/CallEnd';
import red from '@material-ui/core/colors/red';
import green from '@material-ui/core/colors/green';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ToggleSwitch from '@material-ui/core/Switch';
import Tooltip from '@material-ui/core/Tooltip';
import SettingsIcon from '@material-ui/icons/Settings';
import AddCallIcon from 'mdi-material-ui/PhonePlus';
import OfflineIcon from 'mdi-material-ui/LanDisconnect';
import Divider from '@material-ui/core/Divider';
import ScreenShareIcon from '@material-ui/icons/ScreenShare';
import Fab from '@material-ui/core/Fab';
import CircularProgress from '@material-ui/core/CircularProgress';
import ZoomOutMapIcon from '@material-ui/icons/ZoomOutMap';

import renderIf from 'render-if';

import { injectIntl, intlShape, defineMessages, FormattedMessage } from 'react-intl';

import { setError } from 'kpop/es/common/actions';
import TopBar from 'kpop/es/TopBar';
import TopBarBound from 'kpop/es/TopBar/TopBarBound';
import { userShape } from 'kpop/es/shapes';
import AppsSwitcherButton from 'kpop/es/AppsGrid/AppsSwitcherButton';
import AppsSwitcherListItem from 'kpop/es/AppsGrid/AppsSwitcherListItem';
import KopanoMeetIcon from 'kpop/es/icons/KopanoMeetIcon';
import debounce from 'kpop/es/utils/debounce';
import { parseQuery } from 'kpop/es/utils';
import MasterButton from 'kpop/es/MasterButton/MasterButton';
import AsideBar from 'kpop/es/AsideBar';
import { withSnackbar } from 'kpop/es/BaseContainer';

import { fetchAndAddContacts, initializeContactsWithRecents } from '../actions/contacts';
import { fetchRecents, addOrUpdateRecentsFromContact, addOrUpdateRecentsFromGroup } from '../actions/recents';
import {
  setLocalStream,
  unsetLocalStream,
  setScreenshareStream,
  updateOfferAnswerConstraints,
  applyLocalStreamTracks,
  doCall,
  doHangup,
  doAccept,
  doReject,
  doIgnore,
  doGroup,
} from '../actions/kwm';
import {
  requestDisplayMedia,
  requestUserMedia,
  stopDisplayMedia,
  stopUserMedia,
  muteVideoStream,
  muteAudioStream,
  globalSettings as gUMSettings,
} from '../actions/media';
import { writeTextToClipboard } from '../clipboard';
import { pushHistory, isMobile, isTouchDevice } from '../utils';
import { resolveContactID } from '../utils';
import CallGrid from './CallGrid';
import IncomingCallDialog from './IncomingCallDialog';
import FullscreenDialog from './FullscreenDialog';
import Recents from './Recents';
import ContactSearch from './ContactSearch';
import Invite from './Invite';
import BackdropOverlay from './BackdropOverlay';
import GroupControl from './GroupControl';
import ContactControl from './ContactControl';
import NewPublicGroup from './NewPublicGroup';
import RTCStats from './RTCStats';
import { Howling } from './howling';
import IconButtonWithPopover from './IconButtonWithPopover';
import SettingsDialog from './SettingsDialog';

const xsHeightDownBreakpoint = '@media (max-height:450px)';
const minimalHeightDownBreakpoint = '@media (max-height:275px)';
const deskopWidthBreakpoint = '@media (min-width:1025px)';
console.info('Is mobile', isMobile); // eslint-disable-line no-console
console.info('Is touch device', isTouchDevice); // eslint-disable-line no-console

const drawerWidth = 388;

const screenShareScreenID = 'screen1';

const getMuteStateFromURL = () => {
  const hpr = parseQuery(window.location.hash.substr(1));
  const muteState = {
    mic: false,
    cam: false,
  };
  if (hpr.mute) {
    if (hpr.mute & 1) {
      muteState.mic = true;
    }
    if (hpr.mute & 2) {
      muteState.cam = true;
    }
  }
  return muteState;
};

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
    [deskopWidthBreakpoint]: {
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
    bottom: theme.spacing.unit * 4,
    zIndex: theme.zIndex.appBar + 1,
    display: 'flex',
    justifyContent: 'center',
    opacity: 1,
    [theme.breakpoints.down('xs')]: {
      transform: 'scale(.8, .8)',
    },
    [xsHeightDownBreakpoint]: {
      transform: 'scale(.8, .8)',
    },
    transition: theme.transitions.create('opacity', {
      easing: theme.transitions.easing.easeOut,
    }),
    '& > *': {
      marginLeft: theme.spacing.unit,
      marginRight: theme.spacing.unit,
    },
  },
  controlsMiddleHidden: {
    opacity: 0,
  },
  controlsPermanent: {
    position: 'absolute',
    left: theme.spacing.unit * 2,
    bottom: theme.spacing.unit * 4,
    zIndex: theme.zIndex.drawer - 1,
    display: 'flex',
    flexDirection: 'column',
    '& > *': {
      marginTop: theme.spacing.unit * 2,
    },
    opacity: 1,
    [theme.breakpoints.down('xs')]: {
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
  controlsOffset: {
    top: theme.spacing.unit * 2,
    bottom: 'auto',
    opacity: 0.5,
    [deskopWidthBreakpoint]: {
      top: 'auto',
      bottom: theme.spacing.unit * 4,
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
    transition: theme.transitions.create('height', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    [xsHeightDownBreakpoint]: {
      minHeight: 65,
      height: '10vh',
    },
    [minimalHeightDownBreakpoint]: {
      minHeight: 0,
      height: 0,
    },
    [deskopWidthBreakpoint]: {
      height: 'auto',
      flex: 1,
    },
  },
  callWithoutCall: {
    height: 0,
    minHeight: 0,
  },
  callWithCall: {
    height: '100vh',
    [deskopWidthBreakpoint]: {
      height: 'auto',
    },
  },
  callAsSidebar: {
    [deskopWidthBreakpoint]: {
      flex: 'auto',
      maxWidth: 135,
      height: 'auto',
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
  tabs: {
    borderTop: '1px solid #eee',
    borderBottom: '1px solid #eee',
  },
  tab: {
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
    paddingTop: 10,
    [minimalHeightDownBreakpoint]: {
      paddingTop: 0,
    },
  },
  fab: {
    position: 'absolute',
    zIndex: theme.zIndex.drawer - 1,
    bottom: theme.spacing.unit * 4,
    right: theme.spacing.unit * 3,
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
    margin: `${theme.spacing.unit * 2}px 24px 12px 24px`,
  },
  settingsList: {
    minWidth: 230,
  },
});

const translations = defineMessages({
  microphoneIsMutedSnack: {
    id: 'callView.microphoneIsMutedSnack.message',
    defaultMessage: 'Your microphone is muted.',
  },
  noConnectionTooltipTitle: {
    id: 'callView.noConnectionTooltip.title',
    defaultMessage: 'No connection - check your internet connection.',
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
  settingsListLabel: {
    id: 'callView.settingsList.label',
    defaultMessage: 'Settings',
  },
  settingsAudioOnlyLabel: {
    id: 'callView.settingsAudioOnly.label',
    defaultMessage: 'Audio only',
  },
  settingsVideoCoverLabel: {
    id: 'callView.settingsVideoCoverLabel.label',
    defaultMessage: 'Autofit',
  },
  callCurrentlyNotActiveSnack: {
    id: 'callView.notActive.snack',
    defaultMessage: 'Guests can only join active group meetings.',
  },
  callNoAccessSnack: {
    id: 'callView.noAccess.snack',
    defaultMessage: 'You do not have access here.',
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
  rum = null;
  rdm = null;
  localStreamID = 'callview-main';

  constructor(props) {
    super(props);

    // Initialize state.
    const muteState = getMuteStateFromURL();
    this.state = {
      mode: props.hidden ? 'standby' : 'videocall',
      cover: true,
      wasTouched: false,
      withChannel: false,
      muteCam: !!muteState.cam,
      muteMic: !!muteState.mic,
      shareScreen: false,
      rumFailed: false,
      rdmFailed: false,
      sidebarOpen: true,
      sidebarMobileOpen: false,
      openDialogs: {},
      openTab: 'recents',
    };

    this.touchedTimer = null;

    this.settingsMenuRef = React.createRef();
  }

  componentDidMount() {
    const { fetchContacts, fetchRecents } = this.props;
    fetchContacts().catch(err => {
      // Ignore errors here, let global handler do it.
      console.error('failed to fetch contacts', err); // eslint-disable-line no-console
    });
    fetchRecents().catch(err => {
      console.error('failed to fetch recents', err); // eslint-disable-line no-console
    });

    this.updateOfferAnswerConstraints();
    this.requestUserMedia();
  }

  componentDidUpdate(prevProps, prevState) {
    const { mode, previousMode, muteCam, muteMic, rumFailed, withChannel, shareScreen } = this.state;
    const {
      hidden,
      channel,
      connected,
      localAudioVideoStreams,
      setLocalStream,
      intl,
      audioSourceId,
      videoSourceId,
    } = this.props;

    let rum = false;

    if (mode !== prevState.mode) {
      this.updateOfferAnswerConstraints();
      this.requestUserMedia();
      rum = true;
    } else if (audioSourceId !== prevProps.audioSourceId || videoSourceId !== prevProps.videoSourceId) {
      this.requestUserMedia();
      rum = true;
    }

    if (muteCam !== prevState.muteCam) {
      if (rumFailed && !rum) {
        this.requestUserMedia();
        rum = true;
      }
      this.muteVideoStream(muteCam ? muteCam : mode === 'standby');
    }
    if (muteMic !== prevState.muteMic) {
      if (rumFailed && !rum) {
        this.requestUserMedia();
        rum = true;
      }
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
            previousMode: mode,
          });
        }
      } else {
        if (prevProps.hidden && !hidden) {
          console.info('Switching to previous mode after no longer hide', muteMic, muteCam); // eslint-disable-line no-console
          this.setState({
            mode: previousMode ? previousMode : 'videocall',
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
      this.setState({
        sidebarOpen: false,
      });
      if (muteMic) {
        this.notifyBySnack(intl.formatMessage(translations.microphoneIsMutedSnack), {
          variant: 'info',
          autoHideDuration: 10000,
          action: id => {
            return <Button
              size="small"
              onClick={() => {
                this.closeSnack(id);
                this.handleMuteMicClick(false)();
              }}
            >
              <FormattedMessage id="callView.microphoneIsMutedSnack.button.text" defaultMessage="unmute"></FormattedMessage>
            </Button>;
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
        setTimeout(this.stopDisplayMedia, 0); // Delay this, so peer connections have a chance to get cleaned up.
      }
    }
  }

  componentWillUnmount() {
    const { doHangup } = this.props;

    this.closeAllOpenDialogs();
    doHangup();

    this.stopUserMedia();
    this.stopDisplayMedia();
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

  handleMuteCamClick = state => () => {
    if (state === undefined) {
      // Default is toggle.
      state = !this.state.muteCam;
    }

    this.setState({
      muteCam: state,
    });
  }

  handleMuteMicClick = state => () => {
    if (state === undefined) {
      // Default is toggle.
      state = !this.state.muteMic;
    }

    this.setState({
      muteMic: state,
    });
  }

  handleShareScreenClick = state => () => {
    if (state === undefined) {
      state = !this.state.shareScreen;
    }

    if (state) {
      this.requestDisplayMedia().then(stream => {
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
      this.stopDisplayMedia();
    }
    this.setState({
      shareScreen: state,
    });
  }

  handleEntryClick = (entry, kind, mode) => {
    if (!entry.id) {
      console.warn('invalid entry data', entry); // eslint-disable-line no-console
      return;
    }

    switch (kind) {
      case 'group':
        this.doViewGroup(entry);
        if (mode) {
          this.doCallGroup(entry, mode);
        }
        break;

      default:
        // Default is contacts.
        this.doViewContact(entry);
        if (mode) {
          this.doCallContact(entry, mode);
        }
        break;
    }
  };

  handleFabClick = () => {
    this.openDialog({ newCall: true});
  };

  handleSettingsClick = () => {
    this.openDialog({ settings: true});
  }

  handleAcceptClick = (id, mode, entry, kind) => {
    const { doAccept, addOrUpdateRecentsFromContact, localAudioVideoStreams } = this.props;

    const localStream = localAudioVideoStreams[this.localStreamID];
    this.closeAllOpenDialogs();
    this.wakeFromStandby(mode).then(() => {
      if (localStream && localStream.active) {
        return;
      }
      return this.requestUserMedia();
    }).then(() => {
      if (entry) {
        switch (kind) {
          case 'contact':
            this.doViewContact(entry);
            addOrUpdateRecentsFromContact(entry);
            break;
        }
      }

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

  handleIgnoreClick = (id) => {
    const { doIgnore } = this.props;

    doIgnore(id);
  }

  handleSidebarToggle = () => {
    this.setState({
      sidebarOpen: !this.state.sidebarOpen,
      sidebarMobileOpen: !this.state.sidebarMobileOpen,
    });
  }

  handleDialogActionClick = (action, props) => {
    const { intl } = this.props;

    switch (action) {
      case 'new-public-group':
        this.openDialog({
          newPublicGroup: true,
        });
        break;

      case 'view-public-group': {
        this.doViewGroup(props);
        const { id, scope } = props;
        const { addOrUpdateRecentsFromGroup } = this.props;
        addOrUpdateRecentsFromGroup(id, scope);
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
            this.notifyBySnack(intl.formatMessage(translations.copiedLinkToClipboardSnack), { variant: 'info' });
          }).catch(err => console.warn('Failed to copy link to clipboard', err)); // eslint-disable-line no-console
        }
        break;

      case 'invite-group':
        this.openDialog({
          invite: true,
        });
        break;

      case 'invite-by-mailto':
        this.notifyBySnack(intl.formatMessage(translations.inviteByMailtoSnack), { variant: 'info' });
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

  handleVoiceOnlyToggle = () => {
    const { mode } = this.state;
    this.setState({
      mode: mode === 'call' ? 'videocall' : 'call',
    });
  }

  handleAutofitToggle = () => {
    const { cover } = this.state;
    this.setState({
      cover: !cover,
    });
  }

  doViewGroup = (group) => {
    const { history } = this.props;

    pushHistory(history, `/r/${group.scope}/${group.id}`);
  }

  doViewContact = (contact) => {
    const { history } = this.props;

    // NOTE(longsleep): Full entry is injected into navigation state. It is left
    // to the consumer what to do with it.
    pushHistory(history, `/r/call/${contact.id}`, { entry: contact });
  }

  doCallContact = (contact, mode) => {
    const { doCallContact, addOrUpdateRecentsFromContact, localAudioVideoStreams } = this.props;

    const localStream = localAudioVideoStreams[this.localStreamID];
    this.wakeFromStandby(mode).then(() => {
      if (localStream && localStream.active) {
        return;
      }
      return this.requestUserMedia();
    }).then(async () => {
      addOrUpdateRecentsFromContact(contact);
      await doCallContact(contact);
    });
  };

  doCallGroup = (group, mode) => {
    const { doCallGroup, addOrUpdateRecentsFromGroup, localAudioVideoStreams, intl } = this.props;

    const localStream = localAudioVideoStreams[this.localStreamID];
    this.wakeFromStandby(mode).then(() => {
      if (localStream && localStream.active) {
        return;
      }
      return this.requestUserMedia();
    }).then(async () => {
      const { id, scope } = group;
      addOrUpdateRecentsFromGroup(id, scope);

      await doCallGroup(`${scope}/${id}`, err => {
        switch (err.code) {
          case 'create_restricted':
            this.notifyBySnack(intl.formatMessage(translations.callCurrentlyNotActiveSnack), { variant: 'warning' });
            return;
          case 'access_restricted':
            this.notifyBySnack(intl.formatMessage(translations.callNoAccessSnack), { variant: 'warning' });
            return;
        }
        return err;
      });
    });
  }

  wakeFromStandby = (newMode) => {
    const { mode, muteCam } = this.state;
    const { unsetLocalStream } = this.props;

    return new Promise(async (resolve) => {
      newMode = newMode ? newMode : (muteCam ? 'call' : 'videocall');
      if (newMode !== 'default' && mode !== newMode) {
        await unsetLocalStream();
        this.setState({
          mode: newMode,
        }, resolve);
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  notifyBySnack = (message, options={}) => {
    const { enqueueSnackbar } = this.props;
    const { variant, ...other } = options;

    enqueueSnackbar(message, { variant, ...other });
  }

  closeSnack = (id) => {
    const { closeSnackbar } = this.props;

    closeSnackbar(id);
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
      setError,
    } = this.props;

    const stream = localAudioVideoStreams[this.localStreamID];
    if (stream) {
      for (const track of stream.getVideoTracks()) {
        track.onended = undefined;
      }
      const settings = this.getUserMediaSettings();
      muteVideoStream(stream, mute, this.localStreamID, settings).then(async info => {
        const videoTracks = info.stream.getVideoTracks();
        const audioTracks = info.stream.getAudioTracks();
        const state = {
          muteCam: videoTracks.length === 0,
        };
        if (info.newStream && !mute) {
          state.muteMic = audioTracks.length === 0;
        }
        if (videoTracks.length > 0) {
          videoTracks[0].onended = (event) => {
            event.target.onended = undefined;
            muteVideoStream(info.stream);
            this.setState({
              muteCam: true,
            });
          };
        }
        this.setState(state);
        await applyLocalStreamTracks(info);
      }).catch(err => {
        console.warn('failed to toggle mute for video stream', err); // eslint-disable-line no-console
        setError({
          detail: `${err}`,
          message: 'Failed to access camera',
          fatal: false,
        });
        this.setState({
          muteCam: true,
        });
      });
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
      for (const track of stream.getAudioTracks()) {
        track.onended = undefined;
      }
      const settings = this.getUserMediaSettings();
      muteAudioStream(stream, mute, this.localStreamID, settings).then(async info => {
        const videoTracks = info.stream.getVideoTracks();
        const audioTracks = info.stream.getAudioTracks();
        const state = {
          muteMic: audioTracks.length === 0,
        };
        if (info.newStream && !mute) {
          state.muteCam = videoTracks.length === 0;
        }
        if (audioTracks.length > 0) {
          audioTracks[0].onended = (event) => {
            event.target.onended = undefined;
            muteAudioStream(info.stream);
            this.setState({
              muteMic: true,
            });
          };
        }
        this.setState(state);
        await applyLocalStreamTracks(info);
      }).catch(err => {
        console.warn('failed to toggle mute for audio stream', err); // eslint-disable-line no-console
        setError({
          detail: `${err}`,
          message: 'Failed to access microphone',
          fatal: false,
        });
        this.setState({
          muteMic: true,
        });
      });
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

  getUserMediaSettings = () => {
    const { audioSourceId, videoSourceId, mediaSettings } = this.props;

    const settings = {
      // TODO(longsleep): Add more settings from store.
      videoSourceId,
      audioSourceId,
      ...mediaSettings,
    };

    return settings;
  }

  requestDisplayMedia = () => {
    const {
      requestDisplayMedia,
      setScreenshareStream,
      setError,
    } = this.props;

    if (this.rdm) {
      this.rdm.cancel();
      this.rdm = null;
    }

    const id = screenShareScreenID;

    const settings = {
      // TODO(longsleep): Add settings from store.
    };

    // Request display media with reference to allow cancel.
    const rdm = debounce(requestDisplayMedia, 500)(this.localStreamID, settings);
    this.rdm = rdm;

    return rdm.catch(err => {
      setError({
        detail: `${err}`,
        message: 'Failed to access your screen for sharing',
        fatal: false,
      });
      this.setState({
        rdmFailed: true,
      });
      return null;
    }).then(async info => {
      this.setState({
        rdmFailed: false,
      });
      if (info && info.stream) {
        return info.stream;
      }
      return null;
    }).then(async stream => {
      console.debug('requestDisplayMedia stream', id, stream); // eslint-disable-line no-console
      if (stream) {
        const tracks = stream.getVideoTracks();
        if (tracks.length > 0) {
          await setScreenshareStream(id, stream);
          // Register event to clean up the stream when the first video track
          // has ended.
          tracks[0].onended = () => {
            // TODO(longsleep): This might not detect that the stream is old.
            setScreenshareStream(id).catch(err => {
              console.warn('failed to set/clear ended screen share stream', err); // eslint-disable-line no-console
            }); // clears.
          };
        } else {
          console.warn('requestDisplayMedia stream got stream with no video tracks', stream); // eslint-disable-line no-console
        }
      } else {
        await setScreenshareStream(id); // clears.
      }
      return stream;
    });
  };

  stopDisplayMedia = async () => {
    const { stopDisplayMedia } = this.props;

    if (this.rdm) {
      this.rdm.cancel();
      this.rdm = null;
    }

    await stopDisplayMedia(this.localStreamID);
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
      localAudioVideoStreams,
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
    const rum = debounce((id, v, a) => {
      if (!v && !a) {
        const stream = localAudioVideoStreams[this.localStreamID];
        if (stream) {
          for (const track of stream.getTracks()) {
            track.onended = undefined;
          }
        }
      }
      const settings = this.getUserMediaSettings();
      return requestUserMedia(id, v, a, settings);
    }, 500)(this.localStreamID, video, audio);
    this.rum = rum;

    // Response actions.
    return rum.catch(err => {
      setError({
        detail: `${err}`,
        message: 'Failed to access camera and/or microphone',
        fatal: false,
      });
      this.setState({
        muteCam: true,
        muteMic: true,
        rumFailed: true,
      });
      return null;
    }).then(info => {
      if (info && info.stream) {
        const videoTracks = info.stream.getVideoTracks();
        const audioTracks = info.stream.getAudioTracks();
        const state = {};
        if (video && videoTracks.length === 0) {
          state.muteCam = true;
        }
        if (videoTracks.length > 0) {
          videoTracks[0].onended = (event) => {
            event.target.onended = undefined;
            muteVideoStream(info.stream);
            this.setState({
              muteCam: true,
            });
          };
        }
        if (audio && audioTracks.length === 0) {
          state.muteMic = true;
        }
        if (audioTracks.length > 0) {
          audioTracks[0].onended = (event) => {
            event.target.onended = undefined;
            muteAudioStream(info.stream);
            this.setState({
              muteMic: true,
            });
          };
        }
        this.setState(state);
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
      } else {
        const state = {
          rumFailed: false,
        };
        if (video) {
          state.muteCam = true;
        }
        if (audio) {
          state.muteMic = true;
        }
        this.setState(state);
      }
      return null;
    }).then(async stream => {
      if (stream) {
        await setLocalStream(stream);
      } else {
        await unsetLocalStream();
      }
      return stream;
    });
  };

  stopUserMedia = async () => {
    const { stopUserMedia } = this.props;

    if (this.rum) {
      this.rum.cancel();
      this.rum = null;
    }

    await stopUserMedia(this.localStreamID);
  }

  render() {
    const {
      classes,
      profile,
      config,
      guest,
      channel,
      ringing,
      calling,
      localAudioVideoStreams,
      remoteAudioVideoStreams,
      remoteScreenShareStreams,
      connected,
      gUMSupported,
      gDMSupported,
      audioSinkId,
      umVideoPending,
      umAudioPending,
      dmPending,
      intl,
      theme,
    } = this.props;
    const { mode, cover, muteCam, muteMic, shareScreen, wasTouched, withChannel, openDialogs, sidebarOpen, sidebarMobileOpen, openTab } = this.state;

    const anchor = theme.direction === 'rtl' ? 'right' : 'left';

    let controls = [];
    let icons = [];
    let menu = null;
    let dialogs = [];

    let muteCamButton = null;
    let muteMicButton = null;
    let shareScreenButton = null;
    let muteCamButtonIcon = muteCam ? <CamOffIcon /> : <CamIcon />;
    let muteMicButtonIcon = muteMic ? <MicOffIcon /> : <MicIcon />;
    let screenShareViewer = null;

    if (channel && mode === 'videocall' && remoteScreenShareStreams.length > 0) {
      screenShareViewer = <CallGrid
        onClick={this.handleCallGridClick}
        className={classes.screenshare}
        remoteStreams={remoteScreenShareStreams}
        remoteStreamsKey={`stream_screenshare_${screenShareScreenID}`}
        mode={mode}
        cover={false}
        labels={false}
        variant="full"
      />;
    }

    if (mode === 'videocall' || mode === 'standby') {
      muteCamButton = gUMSupported && (<div className={classes.wrappedButton}>
        <Fab
          color="inherit"
          className={classes.muteCamButton}
          onClick={this.handleMuteCamClick()}
        >
          {muteCamButtonIcon}
        </Fab>
        {umVideoPending && <CircularProgress size={68} className={classes.fabProgress} />}
      </div>);
      shareScreenButton = (!isMobile && gDMSupported) && (<div className={classes.wrappedButton}>
        <Fab
          color="inherit"
          className={classNames(
            classes.shareScreenButton,
            {
              [classes.shareScreenButtonActive]: shareScreen,
            }
          )}
          onClick={this.handleShareScreenClick()}
        >
          <ScreenShareIcon />
          {dmPending && <CircularProgress size={68} className={classes.fabProgress} />}
        </Fab>
      </div>);
    }
    if (mode === 'videocall' || mode === 'call' || mode === 'standby') {
      muteMicButton = gUMSupported && (<div className={classes.wrappedButton}>
        <Fab
          color="inherit"
          className={classes.muteMicButton}
          onClick={this.handleMuteMicClick()}
        >
          {muteMicButtonIcon}
        </Fab>
        {umAudioPending && <CircularProgress size={68} className={classes.fabProgress} />}
      </div>);
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

    const quickSettingsList = <List className={classes.settingsList}>
      <ListItem>
        <ListItemIcon>
          <CamOffIcon />
        </ListItemIcon>
        <ListItemText primary={intl.formatMessage(translations.settingsAudioOnlyLabel)} />
        <ListItemSecondaryAction>
          <ToggleSwitch
            color="primary"
            onChange={this.handleVoiceOnlyToggle}
            checked={mode === 'call'}
          />
        </ListItemSecondaryAction>
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <ZoomOutMapIcon />
        </ListItemIcon>
        <ListItemText primary={intl.formatMessage(translations.settingsVideoCoverLabel)} />
        <ListItemSecondaryAction>
          <ToggleSwitch
            color="primary"
            onChange={this.handleAutofitToggle}
            checked={cover}
          />
        </ListItemSecondaryAction>
      </ListItem>
    </List>;

    controls.push(
      <div key='permanent' className={controlsPermanentClassName}>
        {shareScreenButton}
      </div>
    );

    icons.push(
      <Hidden smDown key='settings'>
        <IconButtonWithPopover
          className={classes.settingsButton}
          innerRef={this.settingsMenuRef}
          icon={<SettingsIcon/>}
        >
          <List className={classes.settingsList}>
            <ListItem button onClick={() => {
              this.handleSettingsClick();
              this.settingsMenuRef.current.close();
            }}>
              <ListItemText primary={intl.formatMessage(translations.settingsListLabel)}/>
            </ListItem>
          </List>
          <Divider/>
          {quickSettingsList}
        </IconButtonWithPopover>
      </Hidden>
    );

    if (!guest) {
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
      <div className={classes.menu}>
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
              <Redirect to="/r/call"/>
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

    dialogs.push(
      <SettingsDialog
        key="settings"
        PaperProps={{
          className: classes.dialog,
        }}
        open={openDialogs.settings || false}
        disableBackdropClick
        onClose={() => { this.openDialog({settings: false}); }}
      ></SettingsDialog>
    );

    const drawer = <React.Fragment>
      <Hidden smDown>
        {menu}
        <Divider/>
      </Hidden>
      <Hidden mdUp>
        {quickSettingsList}
        <List>
          <ListItem button onClick={this.handleSettingsClick}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary={intl.formatMessage(translations.settingsListLabel)}/>
          </ListItem>
          <AppsSwitcherListItem/>
        </List>
      </Hidden>
    </React.Fragment>;

    const localStream = localAudioVideoStreams[this.localStreamID];
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
          <BackdropOverlay open={sidebarMobileOpen} onClick={this.handleMenuAnchorClick}></BackdropOverlay>
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
          <AsideBar/>
        </TopBarBound>
        {dialogs}
        <Howling label="ring2" playing={Object.keys(ringing).length > 0} loop/>
        <Howling label="dial1" playing={Object.keys(calling).length > 0} interval={4}/>
      </div>
    );
  }
}

CallView.propTypes = {
  classes: PropTypes.object.isRequired,
  intl: intlShape.isRequired,

  theme: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,

  enqueueSnackbar: PropTypes.func.isRequired,
  closeSnackbar: PropTypes.func.isRequired,

  hidden: PropTypes.bool.isRequired,
  profile: userShape.isRequired,
  config: PropTypes.object.isRequired,
  guest: PropTypes.bool.isRequired,

  connected: PropTypes.bool.isRequired,
  channel: PropTypes.string,
  ringing: PropTypes.object.isRequired,
  calling: PropTypes.object.isRequired,

  fetchContacts: PropTypes.func.isRequired,
  fetchRecents: PropTypes.func.isRequired,
  requestDisplayMedia: PropTypes.func.isRequired,
  requestUserMedia: PropTypes.func.isRequired,
  stopDisplayMedia: PropTypes.func.isRequired,
  stopUserMedia: PropTypes.func.isRequired,
  doCallContact: PropTypes.func.isRequired,
  doHangup: PropTypes.func.isRequired,
  doAccept: PropTypes.func.isRequired,
  doReject: PropTypes.func.isRequired,
  doIgnore: PropTypes.func.isRequired,
  doCallGroup: PropTypes.func.isRequired,
  muteVideoStream: PropTypes.func.isRequired,
  muteAudioStream: PropTypes.func.isRequired,
  updateOfferAnswerConstraints: PropTypes.func.isRequired,
  applyLocalStreamTracks: PropTypes.func.isRequired,
  setLocalStream: PropTypes.func.isRequired,
  unsetLocalStream: PropTypes.func.isRequired,
  setScreenshareStream: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
  addOrUpdateRecentsFromContact: PropTypes.func.isRequired,
  addOrUpdateRecentsFromGroup: PropTypes.func.isRequired,

  localAudioVideoStreams: PropTypes.object.isRequired,
  remoteAudioVideoStreams: PropTypes.array.isRequired,
  remoteScreenShareStreams: PropTypes.array.isRequired,

  gUMSupported: PropTypes.bool.isRequired,
  gDMSupported: PropTypes.bool.isRequired,

  audioSourceId: PropTypes.string.isRequired,
  videoSourceId: PropTypes.string.isRequired,
  audioSinkId: PropTypes.string.isRequired,
  mediaSettings: PropTypes.object.isRequired,

  umAudioPending: PropTypes.bool.isRequired,
  umVideoPending: PropTypes.bool.isRequired,
  dmPending: PropTypes.bool.isRequired,
};

const mapStateToProps = state => {
  const { hidden, profile, config } = state.common;
  const { guest } = state.meet;
  const { connected, channel, ringing, calling } = state.kwm;
  const { umAudioVideoStreams: localAudioVideoStreams, gUMSupported, gDMSupported, videoSourceId, audioSourceId, audioSinkId, umAudioPending, umVideoPending, dmPending, settings: mediaSettings } = state.media;

  const remoteAudioVideoStreams = [];
  const remoteScreenShareStreams = [];
  for (const stream of Object.values(state.streams)) {
    remoteAudioVideoStreams.push(stream);
    if (stream.announces) {
      for (const announce of Object.values(stream.announces)) {
        if (announce.kind === 'screenshare' && announce.id === screenShareScreenID) {
          remoteScreenShareStreams.push(stream);
        }
      }
    }
  }

  return {
    hidden,
    profile,
    config,
    guest,

    connected,
    channel,
    ringing,
    calling,

    localAudioVideoStreams,
    remoteAudioVideoStreams,
    remoteScreenShareStreams,

    gUMSupported,
    gDMSupported,

    videoSourceId,
    audioSourceId,
    audioSinkId,

    umAudioPending,
    umVideoPending,
    dmPending,
    mediaSettings,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    fetchContacts: async () => {
      return dispatch(fetchAndAddContacts());
    },
    fetchRecents: async () => {
      const recents = await dispatch(fetchRecents());
      if (recents !== null) {
        await dispatch(initializeContactsWithRecents());
      }
      return recents;
    },
    requestDisplayMedia: (id='', settings={}) => {
      return dispatch(requestDisplayMedia(id, settings));
    },
    requestUserMedia: (id='', video=true, audio=true, settings={}) => {
      return dispatch(requestUserMedia(id, video, audio, settings));
    },
    stopDisplayMedia: (id='') => {
      return dispatch(stopDisplayMedia(id));
    },
    stopUserMedia: (id='') => {
      return dispatch(stopUserMedia(id));
    },
    doCallContact: (contact, errorCallback) => dispatch((_, getState) => {
      const { config } = getState().common;
      const id = resolveContactID(config, contact);
      return dispatch(doCall(id, errorCallback));
    }),
    doHangup: () => {
      return dispatch(doHangup());
    },
    doAccept: (id) => {
      return dispatch(doAccept(id));
    },
    doReject: (id) => {
      return dispatch(doReject(id));
    },
    doIgnore: (id) => {
      return dispatch(doIgnore(id));
    },
    doCallGroup: (id, errorCallback) => {
      return dispatch(doGroup(id, errorCallback));
    },
    muteVideoStream: (stream, mute=true, id='', settings={}) => {
      return dispatch(muteVideoStream(stream, mute, id, settings));
    },
    muteAudioStream: (stream, mute=true, id='', settings={}) => {
      return dispatch(muteAudioStream(stream, mute, id, settings));
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
    setScreenshareStream: (id, stream) => {
      return dispatch(setScreenshareStream(id, stream));
    },
    setError: (error) => {
      return dispatch(setError(error));
    },
    addOrUpdateRecentsFromContact: (contact) => {
      return dispatch(addOrUpdateRecentsFromContact(contact));
    },
    addOrUpdateRecentsFromGroup: (id, scope) => {
      return dispatch(addOrUpdateRecentsFromGroup(id, scope));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles, {withTheme: true})(injectIntl(withSnackbar(CallView))));
