import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import memoize from 'memoize-one';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import VideocamIcon from '@material-ui/icons/Videocam';
import CallIcon from '@material-ui/icons/Call';
import ClearIcon from '@material-ui/icons/Clear';

import Persona from 'kpop/es/Persona';

import ContactLabel from './ContactLabel';
import { mapContactEntryToUserShape } from './Recents';
import { fetchAndUpdateContactByID } from '../actions/contacts';
import { resolveContactIDFromRecord } from '../utils';

const styles = theme => ({
  header: {
    padding: 0,
  },
  specialActions: {
    justifyContent: 'center',
    margin: `${theme.spacing.unit * 2}px 0`,
    padding: theme.spacing.unit,
    borderTop: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  flex: {
    flex: 1,
  },
  reject: {
    color: 'red',
  },
  leftIcon: {
    marginRight: theme.spacing.unit,
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
      contacts,
      dispatch, // eslint-disable-line
      onRejectClick, // eslint-disable-line
      onAcceptClick, // eslint-disable-line
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
        <DialogContent>
          <ListItem disableGutters className={classes.header}>
            <Persona
              user={user}
              className={classes.avatar} />
            <ListItemText primary="Incoming call"
              secondary={<ContactLabel contact={contact} id={record.id}/>}
              secondaryTypographyProps={{
                color: 'textPrimary',
                variant: 'headline',
              }}
            />
          </ListItem>
        </DialogContent>
        <DialogActions className={classes.specialActions}>
          <Button onClick={this.handleRejectClick(contact, kind)} className={classes.reject}>
            <ClearIcon className={classes.leftIcon}/>
            Reject
          </Button>
        </DialogActions>
        <DialogActions>
          <Button className={classes.flex}
            onClick={this.handleAcceptClick('videocall', contact, kind)}
            color="primary" autoFocus
          >
            <VideocamIcon className={classes.leftIcon}/>
            Accept video
          </Button>
          <Button className={classes.flex}
            onClick={this.handleAcceptClick('call', contact, kind)}
            color="primary"
            autoFocus
          >
            <CallIcon className={classes.leftIcon}/>
            Accept call
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

  record: PropTypes.object.isRequired,

  config: PropTypes.object.isRequired,
  contacts: PropTypes.object.isRequired,

  onAcceptClick: PropTypes.func.isRequired,
  onRejectClick: PropTypes.func.isRequired,

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

export default connect(mapStateToProps)(withStyles(styles)(IncomingCallDialog));
