import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import PublicConferenceIcon from '@material-ui/icons/Group';
import CallIcon from '@material-ui/icons/Call';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import MailIcon from '@material-ui/icons/Mail';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import IconButton from '@material-ui/core/IconButton';
import ShareIcon from '@material-ui/icons/Share';
import Divider from '@material-ui/core/Divider';

import Persona from 'kpop/es/Persona';

import { injectIntl, intlShape, defineMessages, FormattedMessage } from 'react-intl';

import { makeGroupLink } from '../../utils';
import { mapGroupEntryToUserShape } from './Recents';
import { pushHistory } from '../../actions/meet';
import ScopeLabel from '../../components/ScopeLabel';
import ChannelDuration from '../../components/ChannelDuration';

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
  label: {
    wordBreak: 'break-word',
    lineHeight: '1em',
    paddingTop: 2,
    paddingBottom: 4,
  },
  bar: {
    paddingBottom: 0,
  },
  actions: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: theme.spacing(2),
  },
  extra: {
    marginTop: theme.spacing(3),
  },
  fabIcon: {
  },
  leftIcon: {
    marginRight: theme.spacing(1),
  },
  rightButton: {
    marginLeft: 'auto',
  },
});

const translations = defineMessages({
  backAria: {
    id: 'groupControl.backButton.aria',
    defaultMessage: 'Back',
  },
  shareLinkAria: {
    id: 'groupControl.shareLinkButton.aria',
    defaultMessage: 'Share {scope} link',
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
      url: makeGroupLink(group),
    };
  }

  handleEntryClick = (mode) => () => {
    const { group, onEntryClick, onActionClick, config } = this.props;

    switch(mode) {
      case 'share-link-click': {
        const url = makeGroupLink(group, {}, config); // Create link with options.
        onActionClick(mode, {
          id: group.id,
          url,
        });
        return;
      }

      case 'invite-group':
        onActionClick(mode, group);
        break;

      default:
        onEntryClick(group, 'group', mode);
        return;
    }
  };

  handleCloseClick = () => {
    const { dispatch } = this.props;

    dispatch(pushHistory('/r/call'));
  };

  render() {
    const {
      children,
      classes,
      className: classNameProp,
      intl,

      guest,
      group,
      channel,
      ts,
    } = this.props;

    const className = classNames(
      classes.root,
      classNameProp,
    );

    const withChannel = !!channel;
    const withClose = !guest.user && !channel;

    return (
      <div className={className}>
        <div className={classes.base}>
          <Card elevation={0} className={classes.card}>
            <CardActions disableSpacing className={classes.bar}>
              {withClose && <IconButton aria-label={intl.formatMessage(translations.backAria)} onClick={this.handleCloseClick}>
                <ArrowBackIcon />
              </IconButton>}
              <IconButton className={classes.rightButton} aria-label={intl.formatMessage(translations.shareLinkAria, {
                scope: <ScopeLabel scope={group.scope} capitalize/>,
              })} onClick={this.handleEntryClick('share-link-click')}>
                <ShareIcon />
              </IconButton>
            </CardActions>
            <CardContent className={classes.header}>
              <Persona
                user={mapGroupEntryToUserShape(group)}
                forceIcon
                icon={<PublicConferenceIcon/>}
                className={classes.avatar} />
              <Typography variant="h6" className={classes.label}>{group.id}</Typography>
            </CardContent>
            <CardActions className={classes.actions}>
              {withChannel ? <ChannelDuration start={ts}/> : <Button
                variant="contained"
                color="primary"
                onClick={this.handleEntryClick('default')}
              >
                <CallIcon />
                <FormattedMessage id="groupControl.callButton.label" defaultMessage="Call"/>
              </Button>}
            </CardActions>
            <CardContent>
              <Divider />
              <div className={classes.extra}>
                <Button color="primary"
                  onClick={this.handleEntryClick('invite-group')}>
                  <MailIcon className={classes.leftIcon}/>
                  <FormattedMessage
                    id="groupControl.extraInviteButton.label"
                    defaultMessage="Invite to this {scope}"
                    values={{
                      scope: <ScopeLabel scope={group.scope} capitalize/>,
                    }}
                  ></FormattedMessage>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        {children}
      </div>
    );
  }
}

GroupControl.propTypes = {
  dispatch: PropTypes.func.isRequired,

  children: PropTypes.node,
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,
  intl: intlShape.isRequired,

  config: PropTypes.object.isRequired,
  group: PropTypes.object.isRequired,
  guest: PropTypes.object.isRequired,

  channel: PropTypes.string,
  ts: PropTypes.object,

  onEntryClick: PropTypes.func.isRequired,
  onActionClick: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => {
  const { guest } = state.meet;

  return {
    guest,
  };
};

export default connect(mapStateToProps)(withStyles(styles)(injectIntl(GroupControl)));
