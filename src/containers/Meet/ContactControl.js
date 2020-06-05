import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import CallIcon from '@material-ui/icons/Call';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';

import Persona from 'kpop/es/Persona';

import { injectIntl, intlShape, defineMessages, FormattedMessage } from 'react-intl';

import { mapContactEntryToUserShape } from './Recents';
import ContactLabel from './ContactLabel';

import { pushHistory } from '../../actions/meet';
import ChannelDuration from '../../components/ChannelDuration';

const styles = (theme) => ({
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
    paddingBottom: theme.spacing(2),
  },
  bar: {
    paddingBottom: 0,
  },
  fabIcon: {
  },
  rightButton: {
    marginLeft: 'auto',
    visibility: 'hidden',
  },
  channelDuration: {
    ...theme.typography.button,
    fontWeight: 400,
    padding: '6px 16px',
  },
});

const translations = defineMessages({
  backAria: {
    id: 'contactControl.backButton.aria',
    defaultMessage: 'Back',
  },
  videocallAria: {
    id: 'contactControl.videoCallButton.aria',
    defaultMessage: 'Video call',
  },
  voicecallAria: {
    id: 'contactControl.voiceCallButton.aria',
    defaultMessage: 'Voice call',
  },
});

class ContactControl extends React.PureComponent {
  handleEntryClick = (mode) => () => {
    const { entry, onEntryClick } = this.props;

    onEntryClick(entry, entry.kind, mode);
  };

  handleCloseClick = () => {
    const { dispatch } = this.props;

    dispatch(pushHistory('/r/call'));
  };

  render() {
    const {
      classes,
      className: classNameProp,
      intl,

      entry,
      channel,
      ts,
    } = this.props;

    const className = classNames(
      classes.root,
      classNameProp,
    );

    const withChannel = !!channel;
    const withClose = !channel;

    return (
      <div className={className}>
        <div className={classes.base}>
          <Card elevation={0} className={classes.card}>
            <CardActions disableSpacing className={classes.bar}>
              {withClose && <IconButton aria-label={intl.formatMessage(translations.backAria)} onClick={this.handleCloseClick}>
                <ArrowBackIcon />
              </IconButton>}
              <IconButton className={classes.rightButton}>
                <ArrowBackIcon />
              </IconButton>
            </CardActions>
            <CardContent className={classes.header}>
              <Persona
                user={mapContactEntryToUserShape(entry)}
                className={classes.avatar} />
              <Typography variant="h6"><ContactLabel contact={entry} id={entry.id}/></Typography>
              <Typography variant="body2">{entry.jobTitle}</Typography>
            </CardContent>
            <CardActions className={classes.actions}>
              {withChannel ? <ChannelDuration start={ts}/> : <Button
                variant="contained"
                color="primary"
                onClick={this.handleEntryClick('default')}
              >
                <CallIcon />
                <FormattedMessage id="contactControl.callButton.label" defaultMessage="Call"/>
              </Button>}
            </CardActions>
          </Card>
        </div>
      </div>
    );
  }
}

ContactControl.propTypes = {
  dispatch: PropTypes.func.isRequired,

  classes: PropTypes.object.isRequired,
  className: PropTypes.string,
  intl: intlShape.isRequired,

  entry: PropTypes.object.isRequired,

  channel: PropTypes.string,
  ts: PropTypes.object,

  onEntryClick: PropTypes.func,
};

export default connect()(withStyles(styles)(injectIntl(ContactControl)));
