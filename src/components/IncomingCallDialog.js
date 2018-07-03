import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { withStyles } from 'material-ui/styles';
import Button from 'material-ui/Button';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
} from 'material-ui/Dialog';

import ContactLabel from './ContactLabel';
import { forceBase64URLEncoded } from '../utils';

const styles = () => ({
});

class IncomingCallDialog extends React.PureComponent {
  render() {
    const {
      record,
      dispatch, // eslint-disable-line
      contacts,
      onAcceptClick,
      onRejectClick,
      ...other
    } = this.props;

    // Base64 URL encoding required, simple conversion here.
    const contact = contacts[forceBase64URLEncoded(record.id)];

    return (
      <Dialog
        {...other}
      >
        <DialogContent>
          <DialogContentText>
            Incoming call from
          </DialogContentText>
          <DialogContentText>
            <ContactLabel contact={contact} id={record.id}/>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onAcceptClick} color="primary" autoFocus>
            Accept
          </Button>
          <Button onClick={onRejectClick} color="secondary">
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

IncomingCallDialog.propTypes = {
  classes: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,

  record: PropTypes.object.isRequired,

  contacts: PropTypes.object.isRequired,

  onAcceptClick: PropTypes.func.isRequired,
  onRejectClick: PropTypes.func.isRequired,
};

const mapStateToProps = state => {
  const { table: contacts } = state.contacts;

  return {
    contacts,
  };
};

export default connect(mapStateToProps)(withStyles(styles)(IncomingCallDialog));
