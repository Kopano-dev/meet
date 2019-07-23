import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import PublicConferenceIcon from '@material-ui/icons/Group';
import CallIcon from '@material-ui/icons/Call';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ShareIcon from '@material-ui/icons/Share';

import Persona from 'kpop/es/Persona';
import { parseQuery } from 'kpop/es/utils';

import { injectIntl, intlShape, defineMessages, FormattedMessage } from 'react-intl';

import { getCurrentAppPath } from '../base';
import { writeTextToClipboard } from '../clipboard';
import { qualifyAppURL } from '../base';
import { mapGroupEntryToUserShape } from './Recents';
import { pushHistory } from '../utils';
import ScopeLabel, { formatScopeLabel } from './ScopeLabel';

const getAutoSettingsFromURL = () => {
  const hpr = parseQuery(window.location.hash.substr(1));
  if (hpr.auto) {
    const auto = {
      auto: hpr.auto,
      path: getCurrentAppPath().substr(2),
    };
    return auto;
  }
  return null;
};
// Fetch auto settings once, on startup.
const autoSettings = getAutoSettingsFromURL();

const styles = theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0, // See https://bugzilla.mozilla.org/show_bug.cgi?id=1043520
    userSelect: 'none',
    background: theme.palette.background.default,
  },
  base: {
    flex: 1,
  },
  card: {
    background: theme.palette.background.default,
  },
  avatar: {
    margin: '0 auto',
    marginBottom: 8,
  },
  header: {
    paddingTop: 0,
    textAlign: 'center',
  },
  actions: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: theme.spacing.unit * 2,
  },
  fabIcon: {
  },
  burger: {
    marginLeft: 'auto',
  },
});

const translations = defineMessages({
  shareLabel: {
    id: 'groupControl.share.label',
    defaultMessage: 'Share {scope}',
  },
  backAria: {
    id: 'groupControl.backButton.aria',
    defaultMessage: 'Back',
  },
  videocallAria: {
    id: 'groupControl.videoCallButton.aria',
    defaultMessage: 'Video call',
  },
  voicecallAria: {
    id: 'groupControl.voiceCallButton.aria',
    defaultMessage: 'Voice call',
  },
});

class GroupControl extends React.PureComponent {
  state = {
    url: null,
  }

  static getDerivedStateFromProps(props) {
    const { group } = props;

    return {
      url: qualifyAppURL(`/r/${group.scope}/${group.id}`),
    };
  }

  componentDidMount() {
    if (autoSettings && getCurrentAppPath().substr(2) === autoSettings.path) {
      switch (autoSettings.auto) {
        case '1':
          // Auto audio call.
          setTimeout(this.handleEntryClick('call'), 0);
          break;
        case '2':
          // Auto video call.
          setTimeout(this.handleEntryClick('videocall'), 0);
          break;
      }

      // Only ever auto stuff once.
      delete autoSettings.auto;
    }
  }

  handleEntryClick = (mode) => (event) => {
    const { group, onEntryClick } = this.props;

    switch(mode) {
      case 'more':
        this.setState({
          entryMenuAnchorEl: event.target,
        });
        return;

      case 'share':
        this.handleCopyLinkClick();
        return;

      default:
        onEntryClick(group, 'group', mode);
    }
  };

  handleCloseClick = () => {
    const { history } = this.props;

    pushHistory(history, '/r/call');
  };

  handleEntryMenuClose = () => {
    this.setState({
      entryMenuAnchorEl: null,
    });
  }

  handleEntryMenuClick = (mode) => (event) => {
    this.handleEntryMenuClose();
    this.handleEntryClick(mode)(event);
  }

  handleCopyLinkClick = () => {
    const { url } = this.state;

    writeTextToClipboard(url).then(() => {
      console.debug('Copied link to clipboard', url); // eslint-disable-line no-console
    }).catch(err => {
      console.warn('Failed to copy link to clipboard', err); // eslint-disable-line no-console
    });
  };

  render() {
    const { entryMenuAnchorEl } = this.state;
    const {
      classes,
      className: classNameProp,
      intl,

      guest,
      group,
      channel,
    } = this.props;

    const className = classNames(
      classes.root,
      classNameProp,
    );

    const withActions = !channel;
    const withClose = !guest && withActions;

    return (
      <div className={className}>
        <div className={classes.base}>
          <Card elevation={0} className={classes.card}>
            <CardActions>
              {withClose && <IconButton aria-label={intl.formatMessage(translations.backAria)} onClick={this.handleCloseClick}>
                <ArrowBackIcon />
              </IconButton>}
              <IconButton aria-label="More" className={classes.burger} onClick={this.handleEntryClick('more')}>
                <MoreVertIcon />
              </IconButton>
            </CardActions>
            <CardContent className={classes.header}>
              <Persona
                user={mapGroupEntryToUserShape(group)}
                forceIcon
                icon={<PublicConferenceIcon/>}
                className={classes.avatar} />
              <Typography variant="h6">{group.id}</Typography>
              <Typography variant="body2"><ScopeLabel scope={group.scope} capitalize/></Typography>
            </CardContent>
            {withActions && <CardActions className={classes.actions}>
              <Button
                variant="contained"
                color="primary"
                onClick={this.handleEntryClick('default')}
              >
                <CallIcon />
                <FormattedMessage id="groupControl.callButton.label" defaultMessage="Call"/>
              </Button>
            </CardActions>}
          </Card>
          <Menu
            anchorEl={entryMenuAnchorEl}
            open={Boolean(entryMenuAnchorEl)}
            onClose={this.handleEntryMenuClose}
          >
            <MenuItem onClick={this.handleEntryMenuClick('share')}>
              <ListItemIcon>
                <ShareIcon />
              </ListItemIcon>
              <ListItemText inset primary={intl.formatMessage(translations.shareLabel, {
                scope: formatScopeLabel(intl, group.scope),
              })} />
            </MenuItem>
          </Menu>
        </div>
      </div>
    );
  }
}

GroupControl.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,
  intl: intlShape.isRequired,

  group: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  guest: PropTypes.bool.isRequired,

  channel: PropTypes.string,

  onEntryClick: PropTypes.func,
};

const mapStateToProps = (state) => {
  const { guest } = state.meet;

  return {
    guest,
  };
};

export default connect(mapStateToProps)(withStyles(styles)(injectIntl(GroupControl)));
