import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { withStyles } from 'material-ui/styles';
import Button from 'material-ui/Button';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  withMobileDialog,
} from 'material-ui/Dialog';


const styles = () => ({
});

class ErrorDialog extends React.PureComponent {
  handleReload() {
    window.location.reload();
  }

  render() {
    const {
      fullScreen,
      error,
      dispatch, // eslint-disable-line
      ...other
    } = this.props;

    return (
      <Dialog
        fullScreen={fullScreen}
        {...other}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">{error.message}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {error.detail}
          </DialogContentText>
          <DialogContentText>
            This is a fatal error and the app needs to be reloaded.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleReload} color="primary" autoFocus>
            Reload
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

ErrorDialog.propTypes = {
  classes: PropTypes.object.isRequired,

  error: PropTypes.object.isRequired,
  fullScreen: PropTypes.bool.isRequired,
};

const mapStateToProps = state => {
  return {
    error: state.common.error,
  };
};

export default connect(mapStateToProps)(withMobileDialog()(withStyles(styles)(ErrorDialog)));
