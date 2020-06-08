import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';

import AudioVideo from '../../components/AudioVideo';

const styles = (theme) => ({
  root: {
    background: `${theme.videoBackground.top}`,
    width: '12vh',
    height: '12vh',
    borderRadius: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioVideo: {
    height: '100%',
    width: '100%',
    borderRadius: 5,
    overflow: 'hidden',
  },
  autoHeight: {
    height: 'auto',
    minHeight: 'auto !important',
  },
});

class FloatingAudioVideo extends React.PureComponent {
  render() {
    const {
      classes,
      className: classNameProp,
      cover,
      hostRef,
      ...other
    } = this.props;

    const className = classNames(
      classes.root,
      classNameProp,
      {
        [classes.autoHeight]: !cover,
      },
    );

    return (
      <div className={className} ref={hostRef}>
        <AudioVideo className={classNames(
          classes.audioVideo, {
            [classes.autoHeight]: !cover,
          })} round cover={cover} {...other}>
        </AudioVideo>
      </div>
    );
  }
}

FloatingAudioVideo.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,

  cover: PropTypes.bool,

  hostRef: PropTypes.func,
};

export default withStyles(styles)(FloatingAudioVideo);
