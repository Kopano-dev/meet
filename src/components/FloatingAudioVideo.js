import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { withStyles } from 'material-ui/styles';

import AudioVideo from './AudioVideo';

const styles = {
  root: {
    background: 'black',
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
  audioVideoVideo: {
    // NOTE(longsleep): Additional border radius is required for Safari since it
    // cannot crop video elements on outer elements.
    borderRadius: '50%',
    overflow: 'hidden',
  },
};

class FloatingAudioVideo extends React.PureComponent {
  render() {
    const {
      classes,
      className: classNameProp,
      children,
      ...other
    } = this.props;

    const className = classNames(
      classes.root,
      classNameProp,
    );

    return (
      <div className={className}>
        <AudioVideo className={classes.audioVideo} classes={{
          video: classes.audioVideoVideo,
        }} {...other}>
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
};

export default withStyles(styles)(FloatingAudioVideo);
