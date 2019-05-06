import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Button from '@material-ui/core/Button';
import Avatar from '@material-ui/core/Avatar';
import PublicConferenceIcon from '@material-ui/icons/Group';
import Chip from '@material-ui/core/Chip';
import LinkIcon from '@material-ui/icons/Link';
import VideocamIcon from '@material-ui/icons/Videocam';
import CallIcon from '@material-ui/icons/Call';

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

const styles = (theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0, // See https://bugzilla.mozilla.org/show_bug.cgi?id=1043520
    userSelect: 'none',
  },
  base: {
    flex: 1,
  },
  card: {
  },
  actions: {
    flex: 1,
  },
  leftIcon: {
    marginRight: theme.spacing.unit,
  },
  close: {
    marginLeft: 'auto',
    [theme.breakpoints.up('sm')]: {
      marginRight: -8,
    },
  },
});

const translations = defineMessages({
  shareLabel: {
    id: 'groupControl.share.label',
    defaultMessage: 'Share {scope}',
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

  handleEntryClick = (mode) => () => {
    const { group, onEntryClick } = this.props;

    onEntryClick(group, 'group', mode);
  };

  handleCloseClick = () => {
    const { history } = this.props;

    pushHistory(history, '/r/call');
  };

  handleCopyLinkClick = () => {
    const { url } = this.state;

    writeTextToClipboard(url).then(() => {
      console.debug('Copied link to clipboard', url); // eslint-disable-line no-console
    }).catch(err => {
      console.warn('Failed to copy link to clipboard', err); // eslint-disable-line no-console
    });
  };

  render() {
    const {
      classes,
      className: classNameProp,
      intl,

      guest,
      group,
    } = this.props;

    const className = classNames(
      classes.root,
      classNameProp,
    );

    const withClose = !guest;

    return (
      <div className={className}>
        <div className={classes.base}>
          <List disablePadding>
            <ListItem>
              <Persona
                user={mapGroupEntryToUserShape(group)}
                forceIcon
                icon={<PublicConferenceIcon/>}
                className={classes.avatar} />
              <ListItemText primary={group.id} secondary={<ScopeLabel scope={group.scope} capitalize/>} />
            </ListItem>
          </List>
          <Card elevation={0} className={classes.card}>
            <CardContent>
              <Chip
                className={classes.chip}
                avatar={<Avatar><LinkIcon/></Avatar>}
                label={intl.formatMessage(translations.shareLabel, {
                  scope: formatScopeLabel(intl, group.scope),
                })}
                onClick={this.handleCopyLinkClick}
              />
            </CardContent>
            <CardActions className={classes.actions}>
              <Button
                color="primary"
                onClick={this.handleEntryClick('videocall')}
              >
                <VideocamIcon className={classes.leftIcon} />
                <FormattedMessage id="groupControl.videoCallButton.text" defaultMessage="Video"></FormattedMessage>
              </Button>
              <Button
                color="primary"
                onClick={this.handleEntryClick('call')}
              >
                <CallIcon className={classes.leftIcon} />
                <FormattedMessage id="groupControl.voiceCallButton.text" defaultMessage="Call"></FormattedMessage>
              </Button>
              {withClose && <Button
                color="primary"
                className={classes.close}
                onClick={this.handleCloseClick}
              >
                <FormattedMessage id="groupControl.closeButton.text" defaultMessage="Close"></FormattedMessage>
              </Button>}
            </CardActions>
          </Card>
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

  onEntryClick: PropTypes.func,
};

const mapStateToProps = (state) => {
  const { guest } = state.common;

  return {
    guest,
  };
};

export default connect(mapStateToProps)(withStyles(styles)(injectIntl(GroupControl)));
