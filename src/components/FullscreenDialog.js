import React from 'react';
import PropTypes from 'prop-types';

import { withStyles } from 'material-ui/styles';
import Dialog from 'material-ui/Dialog';
import Button from 'material-ui/Button';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import IconButton from 'material-ui/IconButton';
import Typography from 'material-ui/Typography';
import CloseIcon from 'material-ui-icons/Close';

const styles = () => ({
  appBar: {
    position: 'relative',
  },
  leftButton: {
    marginLeft: -12,
    marginRight: 20,
  },
  flex: {
    flex: 1,
  },
});

class FullscreenDialog extends React.PureComponent {
  handleClose = (event) => {
    const { onClose } = this.props;

    if (onClose) {
      onClose(event);
    }
  }

  render() {
    const { children, classes, topTitle, topElevation, open } = this.props;

    return (
      <Dialog
        fullScreen
        open={open}
        onClose={this.handleClose}
      >
        <AppBar className={classes.appBar} color="inherit" elevation={topElevation}>
          <Toolbar>
            <IconButton color="inherit" className={classes.leftButton} onClick={this.handleClose} aria-label="Close">
              <CloseIcon />
            </IconButton>
            <Typography variant="title" color="inherit" className={classes.flex}>
              {topTitle}
            </Typography>
            <Button color="primary" onClick={this.handleClose}>
              Cancel
            </Button>
          </Toolbar>
        </AppBar>
        {children}
      </Dialog>
    );
  }
}

FullscreenDialog.defaultProps = {
  topElevation: 4,
};

FullscreenDialog.propTypes = {
  children: PropTypes.node,
  classes: PropTypes.object.isRequired,

  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func,

  topTitle: PropTypes.string,
  topElevation: PropTypes.number.isRequired,
};

export default withStyles(styles)(FullscreenDialog);
