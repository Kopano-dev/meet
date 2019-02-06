import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import InfoIcon from '@material-ui/icons/Info';
import Slide from '@material-ui/core/Slide';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import WarningIcon from '@material-ui/icons/Warning';
import green from '@material-ui/core/colors/green';
import amber from '@material-ui/core/colors/amber';

const variantIcon = {
  success: CheckCircleIcon,
  warning: WarningIcon,
  error: ErrorIcon,
  info: InfoIcon,
};

const styles1 = theme => ({
  success: {
    backgroundColor: green[600],
  },
  error: {
    backgroundColor: theme.palette.error.dark,
  },
  info: {
    backgroundColor: theme.palette.primary.dark,
  },
  warning: {
    backgroundColor: amber[700],
  },
  icon: {
    fontSize: 20,
  },
  iconVariant: {
    opacity: 0.9,
    marginRight: theme.spacing.unit,
  },
  message: {
    display: 'flex',
    alignItems: 'center',
  },
});

const styles2 = () => ({
  snack: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
});

function TransitionDown(props) {
  return <Slide {...props} direction="down" />;
}

function SnacksContent(props) {
  const { classes, className, onClose, snack, ...other } = props;
  const { message, variant, button } = snack;
  const Icon = variantIcon[variant];

  return (
    <SnackbarContent
      className={classNames(classes[variant], className)}
      aria-describedby="client-snackbar"
      message={
        <span id="client-snackbar" className={classes.message}>
          <Icon className={classNames(classes.icon, classes.iconVariant)} />
          {message}
        </span>
      }
      action={[
        <React.Fragment key="button">{button}</React.Fragment>,
        <IconButton
          key="close"
          aria-label="Close"
          color="inherit"
          className={classes.close}
          onClick={onClose}
        >
          <CloseIcon className={classes.icon} />
        </IconButton>,
      ]}
      {...other}
    />
  );
}

SnacksContent.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,

  snack: PropTypes.object.isRequired,
  onClose: PropTypes.func,
};

const SnacksContentWrapper = withStyles(styles1)(SnacksContent);

class Snacks extends React.PureComponent {
  queue = [];
  count = 0;

  state = {
    open: false,
    snack: {},
  };

  componentDidUpdate(prevProps) {
    const { snacks } = this.props;

    if (snacks && snacks.length > 0 && prevProps.snacks[0] !== snacks[0]) {
      const snack = {
        variant: 'info',
        ...snacks[0],
      };
      this.addToQueue(snack);
    }
  }

  addToQueue = (snack) => {
    this.queue.push({
      ...snack,
      key: this.count++,
    });

    if (this.state.open) {
      // Immediately begin dismissing current message and show new one.
      this.setState({ open: false });
    } else {
      this.processQueue();
    }
  };

  processQueue = (more=false) => {
    if (this.queue.length > 0) {
      this.setState({
        snack: this.queue.shift(),
        open: true,
      });
    } else {
      if (more) {
        this.props.shiftSnacks();
      }
    }
  };

  handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    this.setState({ open: false });
  };

  handleExited = () => {
    this.processQueue(true);
  };

  render() {
    const { classes } = this.props;
    const { snack } = this.state;

    return (
      <Snackbar
        key={snack.key}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        TransitionComponent={TransitionDown}
        open={this.state.open}
        autoHideDuration={6000}
        onClose={this.handleClose}
        onExited={this.handleExited}
      >
        <SnacksContentWrapper
          snack={snack}
          onClose={this.handleClose}
          className={classes.snack}
        />
      </Snackbar>
    );
  }
}

Snacks.propTypes = {
  classes: PropTypes.object.isRequired,

  snacks: PropTypes.array.isRequired,
  shiftSnacks: PropTypes.func.isRequired,
};

export default withStyles(styles2)(Snacks);
