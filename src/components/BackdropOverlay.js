import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { withStyles } from 'material-ui/styles';
import Fade from 'material-ui/transitions/Fade';

const styles = theme => ({
  root: {
    position: 'absolute',
    display: 'flex',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    zIndex: theme.zIndex.appBar - 5,
    // Remove grey highlight
    WebkitTapHighlightColor: 'transparent',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  invisible: {
    backgroundColor: 'transparent',
  },
});

class BackdropOverlay extends React.PureComponent {
  render() {
    const { classes, className, invisible, open, transitionDuration, ...other } = this.props;

    if (!open) {
      return null;
    }

    const rootClassName = classNames(
      classes.root,
      {
        [classes.invisible]: invisible,
      },
      className,
    );

    return (
      <Fade appear in={open} timeout={transitionDuration} {...other}>
        <div
          className={rootClassName}
          aria-hidden="true"
        >
        </div>
      </Fade>
    );
  }
}

BackdropOverlay.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,

  invisible: PropTypes.bool,
  open: PropTypes.bool.isRequired,

  transitionDuration: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({ enter: PropTypes.number, exit: PropTypes.number }),
  ]),
};

BackdropOverlay.defaultProps = {
  invisible: false,
};


export default withStyles(styles)(BackdropOverlay);
