import React from 'react';
import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';

import { injectIntl, intlShape, defineMessages, FormattedMessage } from 'react-intl';

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

const translations = defineMessages({
  closeButtonAria: {
    id: 'fullscreenDialog.closeButton.aria',
    defaultMessage: 'Close',
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
    const { children, classes, topTitle, topElevation, open, intl } = this.props;

    return (
      <Dialog
        fullScreen
        open={open}
        onClose={this.handleClose}
      >
        <AppBar className={classes.appBar} color="inherit" elevation={topElevation}>
          <Toolbar>
            <IconButton color="inherit" className={classes.leftButton} onClick={this.handleClose} aria-label={intl.formatMessage(translations.closeButtonAria)}>
              <CloseIcon />
            </IconButton>
            <Typography variant="title" color="inherit" className={classes.flex}>
              {topTitle}
            </Typography>
            <Button color="primary" onClick={this.handleClose}>
              <FormattedMessage id="fullscreenDialog.cancelButton.text" defaultMessage="Cancel"></FormattedMessage>
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
  intl: intlShape.isRequired,

  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func,

  topTitle: PropTypes.string,
  topElevation: PropTypes.number.isRequired,
};

export default withStyles(styles)(injectIntl(FullscreenDialog));
