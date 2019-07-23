import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import memoize from 'memoize-one';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import VideocamIcon from '@material-ui/icons/Videocam';
import CallIcon from '@material-ui/icons/Call';
import ClearIcon from '@material-ui/icons/Clear';
import red from '@material-ui/core/colors/red';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import withMobileDialog from '@material-ui/core/withMobileDialog';

import Persona from 'kpop/es/Persona';

import { injectIntl, intlShape, defineMessages, FormattedMessage } from 'react-intl';

import ContactLabel from './ContactLabel';
import { mapContactEntryToUserShape } from './Recents';
import { fetchAndUpdateContactByID } from '../actions/contacts';
import { resolveContactIDFromRecord } from '../utils';

const styles = theme => ({
  appBar: {
    position: 'relative',
  },
  leftButton: {
    marginLeft: -12,
    marginRight: 20,
  },
  avatar: {
    margin: '0 auto',
    marginBottom: 8,
  },
  header: {
    padding: 0,
    paddingTop: theme.spacing.unit * 2,
    textAlign: 'center',
  },
  specialActions: {
    justifyContent: 'center',
    margin: `${theme.spacing.unit * 2}px 0`,
    padding: theme.spacing.unit,
  },
  flex: {
    flex: 1,
  },
  reject: {
    color: theme.palette.getContrastText(red[500]),
    backgroundColor: red[500],
    '&:hover': {
      backgroundColor: red[700],
    },
  },
  leftIcon: {
    marginRight: theme.spacing.unit,
  },
});

const translations = defineMessages({
  incomingCallTitle: {
    id: 'incomingCallDialog.incomingCall.title',
    defaultMessage: 'Incoming call',
  },
  closeButtonAria: {
    id: 'incomingCallDialog.closeButton.aria',
    defaultMessage: 'Close',
  },
});

class IncomingCallDialog extends React.PureComponent {
  handleAcceptClick = (mode, entry, kind) => () => {
    const { onAcceptClick } = this.props;

    onAcceptClick(mode, entry, kind);
  }

  handleRejectClick = (entry, kind) => () => {
    const { onRejectClick } = this.props;

    onRejectClick(entry, kind);
  }

  handleCloseClick = () => {
    const { onCloseClick } = this.props;

    onCloseClick();

  }

  handleIgnoreClick = () => {
    const { onIgnoreClick } = this.props;

    onIgnoreClick();
  }

  getContactFromRecord = memoize(record => {
    const { dispatch, contacts, config } = this.props;

    const id = resolveContactIDFromRecord(config, record);
    const contact = contacts[id];
    if (!contact) {
      // Try to fetch contact data via api.
      dispatch(fetchAndUpdateContactByID(id)).catch(err => {
        console.warn('failed to fetch contact information for incoming call', err); // eslint-disable-line no-console
      });
    }

    return [contact, id];
  })

  render() {
    const {
      classes,
      record,
      mode,
      contacts,
      dispatch, // eslint-disable-line
      onRejectClick, // eslint-disable-line
      onAcceptClick, // eslint-disable-line
      onCloseClick,
      onIgnoreClick,
      intl,
      ...other
    } = this.props;

    // Try to fetch contact from record.
    let [contact, id] = this.getContactFromRecord(record);
    if (!contact && id) {
      // Always check if we have contacts.
      contact = contacts[id];
    }

    // Map contact for display purposes.
    const kind = contact ? 'contact' : undefined;
    const user = contact ? mapContactEntryToUserShape(contact) : {
      id,
    };

    return (
      <Dialog
        {...other}
      >
        <AppBar className={classes.appBar} color="inherit" elevation={0}>
          <Toolbar>
            {onCloseClick && <IconButton color="inherit" className={classes.leftButton} onClick={this.handleCloseClick} aria-label={intl.formatMessage(translations.closeButtonAria)}>
              <CloseIcon />
            </IconButton>}
            <Typography variant="h6" color="inherit" className={classes.flex}>
              <FormattedMessage id="incomingCallDialog.incomingCall.title" defaultMessage="Incoming call"/>
            </Typography>
            {onIgnoreClick && <Button color="secondary" onClick={this.handleIgnoreClick}>
              <FormattedMessage id="fullscreenDialog.ignoreButton.text" defaultMessage="Ignore"></FormattedMessage>
            </Button>}
          </Toolbar>
        </AppBar>
        <DialogContent className={classes.header}>
          <Persona
            user={user}
            className={classes.avatar} />
          <Typography variant="h6"><ContactLabel contact={contact} id={record.id}/></Typography>
          <Typography variant="body2">{contact.jobTitle}</Typography>
        </DialogContent>
        <DialogActions className={classes.specialActions}>
          <Button
            onClick={this.handleAcceptClick('default', contact, kind)}
            variant="contained"
            color="primary"
            autoFocus
          >
            {mode === 'videocall' ? <VideocamIcon className={classes.leftIcon}/> : <CallIcon className={classes.leftIcon}/>}
            <FormattedMessage id="incomingCallDialog.acceptVideoCallButton.text" defaultMessage="Accept"></FormattedMessage>
          </Button>
          <Button
            onClick={this.handleRejectClick(contact, kind)}
            className={classes.reject}
            variant="contained"
          >
            <ClearIcon className={classes.leftIcon}/>
            <FormattedMessage id="incomingCallDialog.rejectButton.text" defaultMessage="Reject"></FormattedMessage>
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

IncomingCallDialog.defaultProps = {
  maxWidth: 'xs',
  fullWidth: true,
};

IncomingCallDialog.propTypes = {
  classes: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  intl: intlShape.isRequired,

  fullScreen: PropTypes.bool.isRequired,

  mode: PropTypes.string.isRequired,
  record: PropTypes.object.isRequired,

  config: PropTypes.object.isRequired,
  contacts: PropTypes.object.isRequired,

  onAcceptClick: PropTypes.func.isRequired,
  onRejectClick: PropTypes.func.isRequired,
  onCloseClick: PropTypes.func,
  onIgnoreClick: PropTypes.func,

  maxWidth: PropTypes.string,
  fullWidth: PropTypes.bool,
};

const mapStateToProps = state => {
  const { table: contacts } = state.contacts;
  const { config } = state.common;

  return {
    contacts,
    config,
  };
};

export default connect(mapStateToProps)(withStyles(styles)(withMobileDialog()(injectIntl(IncomingCallDialog))));
