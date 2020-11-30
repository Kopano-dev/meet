import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import withMobileDialog from '@material-ui/core/withMobileDialog';

import { injectIntl, intlShape, defineMessages, FormattedMessage } from 'react-intl';

const styles = (theme) => ({
  appBar: {
    position: 'relative',
  },
  leftButton: {
    marginLeft: -12,
    marginRight: 20,
  },
  title: {
    flex: 1,
    whiteSpace: 'nowrap',
    maxWidth: '60vw',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  default: {
    [theme.breakpoints.up('md')]: {
      height: '60%',
      width: '80vw',
      maxHeight: 600,
      minHeight: 340,
      minWidth: 480,
    },
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
    const { children, classes, topTitle, topElevation, open, responsive, fullScreen, intl, variant, PaperProps: paperPropsProp, ...other } = this.props;

    const isfullScreen = !responsive || fullScreen;

    return (
      <Dialog
        fullScreen={isfullScreen}
        open={open}
        onClose={this.handleClose}
        PaperProps={{
          ...paperPropsProp,
          className: classNames(paperPropsProp.className, {
            [classes.default]: variant === 'default',
          }),
        }}
        {...other}
      >
        <AppBar className={classes.appBar} color="inherit" elevation={topElevation}>
          <Toolbar>
            <IconButton color="inherit" className={classes.leftButton} onClick={this.handleClose} aria-label={intl.formatMessage(translations.closeButtonAria)}>
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}>
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

  variant: 'default',
  PaperProps: {},
};

FullscreenDialog.propTypes = {
  children: PropTypes.node,
  classes: PropTypes.object.isRequired,
  intl: intlShape.isRequired,

  variant: PropTypes.oneOf(['default', 'inherit']),

  open: PropTypes.bool.isRequired,
  responsive: PropTypes.bool,
  fullScreen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,

  topTitle: PropTypes.string,
  topElevation: PropTypes.number.isRequired,

  PaperProps: PropTypes.object,
};

export default withStyles(styles)(withMobileDialog()(injectIntl(FullscreenDialog)));
