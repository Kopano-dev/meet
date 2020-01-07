import React from 'react';
import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab';
import CircularProgress from '@material-ui/core/CircularProgress';
import green from '@material-ui/core/colors/green';

export const styles = () => {
  return {
    root: {
      position: 'relative',
    },
    progress: {
      color: green[500],
      position: 'absolute',
      top: -6,
      left: -6,
      zIndex: 1,
    },
  };
};

class FabWithProgress extends React.PureComponent {
  render() {
    const { classes, children, className: classNameProp, pending, ...other  } = this.props;

    return (
      <div className={classes.root}>
        <Fab
          className={classNameProp}
          {...other}
        >
          {children}
        </Fab>
        {pending && <CircularProgress size={68} className={classes.progress} />}
      </div>
    );
  }
}

FabWithProgress.propTypes = {
  children: PropTypes.node,
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,

  pending: PropTypes.bool,
};

export default withStyles(styles)(FabWithProgress);
