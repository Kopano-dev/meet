import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';

import AudioVideo from './AudioVideo';

const styles = (theme) => ({
  root: {
    background: `${theme.videoBackground.top}`,
    width: '12vh',
    height: '12vh',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioVideo: {
    height: '100%',
    width: '100%',
    borderRadius: '50%',
    overflow: 'hidden',
  },
});

class FloatingAudioVideo extends React.PureComponent {
  render() {
    const {
      classes,
      className: classNameProp,
      children,
      hostRef,
      ...other
    } = this.props;

    const className = classNames(
      classes.root,
      classNameProp,
    );

    return (
      <div className={className} ref={hostRef}>
        <AudioVideo className={classes.audioVideo} round {...other}>
          {children}
        </AudioVideo>
      </div>
    );
  }
}

FloatingAudioVideo.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,

  children: PropTypes.element,

  hostRef: PropTypes.func,
};

export default withStyles(styles)(FloatingAudioVideo);
