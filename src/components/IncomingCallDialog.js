import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

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

import { forceBase64URLEncoded } from 'kpop/es/utils';
import Persona from 'kpop/es/Persona';

import ContactLabel from './ContactLabel';
import { mapContactEntryToUserShape } from './Recents';

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
  handleAcceptClick = (mode) => () => {
    const { onAcceptClick } = this.props;

    onAcceptClick(mode);
  }

  handleRejectClick = () => {
    const { onRejectClick } = this.props;

    onRejectClick();
  }

  render() {
    const {
      classes,
      record,
      dispatch, // eslint-disable-line
      onRejectClick, // eslint-disable-line
      onAcceptClick, // eslint-disable-line
      contacts,
      ...other
    } = this.props;

    // Base64 URL encoding required, simple conversion here.
    const contact = contacts[forceBase64URLEncoded(record.id)];

    return (
      <Dialog
        {...other}
      >
        <DialogContent>
          <ListItem disableGutters className={classes.header}>
            <Persona
              user={mapContactEntryToUserShape(contact)}
              className={classes.avatar} />
            <ListItemText primary="Incoming call" secondary={<ContactLabel contact={contact} id={record.id}/>} secondaryTypographyProps={{
              color: 'textPrimary',
              variant: 'headline',
            }} />
          </ListItem>
        </DialogContent>
        <DialogActions className={classes.specialActions}>
          <Button onClick={this.handleRejectClick} className={classes.reject}>
            <ClearIcon className={classes.leftIcon}/>
            Reject
          </Button>
        </DialogActions>
        <DialogActions>
          <Button className={classes.flex} onClick={this.handleAcceptClick('videocall')} color="primary" autoFocus>
            <VideocamIcon className={classes.leftIcon}/>
            Video
          </Button>
          <Button className={classes.flex} onClick={this.handleAcceptClick('call')} color="primary" autoFocus>
            <CallIcon className={classes.leftIcon}/>
            Phone
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

  contacts: PropTypes.object.isRequired,

  onAcceptClick: PropTypes.func.isRequired,
  onRejectClick: PropTypes.func.isRequired,

  maxWidth: PropTypes.string,
  fullWidth: PropTypes.bool,
};

const mapStateToProps = state => {
  const { table: contacts } = state.contacts;

  return {
    contacts,
  };
};

export default connect(mapStateToProps)(withStyles(styles)(IncomingCallDialog));
