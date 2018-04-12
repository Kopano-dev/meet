import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { withStyles } from 'material-ui/styles';
import Button from 'material-ui/Button';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  withMobileDialog,
} from 'material-ui/Dialog';

import { doAccept, doReject } from '../actions/kwm';

const styles = () => ({
});

class IncomingCallDialog extends React.PureComponent {
  handleAccept = () => {
    const { dispatch, record } = this.props;

    dispatch(doAccept(record.id));
  }

  handleReject = () => {
    const { dispatch, record } = this.props;

    dispatch(doReject(record.id));
  }

  render() {
    const {
      fullScreen,
      record,
      dispatch, // eslint-disable-line
      contacts,
      ...other
    } = this.props;

    // Base64 URL encoding required, simple conversion here. See
    // https://tools.ietf.org/html/rfc4648#section-5 for the specification.
    const id = record.id.replace(/\+/g, '-').replace(/\//, '_');

    let contactLabel = '';
    const contact = contacts[id];
    if (contact) {
      contactLabel = contact.displayName;
      if (contactLabel === '') {
        contactLabel = contact.userPrincipalName;
      }
    }
    if (contactLabel === '') {
      contactLabel = <em title={record.id}>unknown</em>;
    }

    return (
      <Dialog
        fullScreen={fullScreen}
        {...other}
      >
        <DialogContent>
          <DialogContentText>
            Incoming call from
          </DialogContentText>
          <DialogContentText>
            {contactLabel}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleAccept} color="primary" autoFocus>
            Accept
          </Button>
          <Button onClick={this.handleReject} color="secondary">
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
  fullScreen: PropTypes.bool.isRequired,

  contacts: PropTypes.object.isRequired,
};

const mapStateToProps = state => {
  const { table: contacts } = state.contacts;

  return {
    contacts,
  };
};

export default connect(mapStateToProps)(withMobileDialog()(withStyles(styles)(IncomingCallDialog)));
