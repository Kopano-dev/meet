import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import CallIcon from '@material-ui/icons/Call';
import CamOffIcon from '@material-ui/icons/VideocamOff';
import MicOffIcon from '@material-ui/icons/MicOff';
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmpty';
import LinearProgress from '@material-ui/core/LinearProgress';

import memoize from 'memoize-one';

import DisplayNameLabel from './DisplayNameLabel';
import { globalSettings } from '../actions/media';

const isMobileSafari = (userAgent = window.navigator.userAgent) => {
  return /iP(ad|od|hone)/i.test(userAgent) && /WebKit/i.test(userAgent);
};

const getBugs = () => {
  const bugs = {};

  if (isMobileSafari()) {
    // NOTE(longsleep): Mobile Safari plays only a single video element on a page
    // which is not muted. See https://bugs.webkit.org/show_bug.cgi?id=162366 and
    // https://bugs.webkit.org/show_bug.cgi?id=186605 for reference.
    Object.assign(bugs, {cannotPlayMoreThanOneUnmutedVideo: true});
  }

  console.debug('using audio/video bugs list', bugs); // eslint-disable-line no-console
  return bugs;
};
export const bugs = getBugs();

const styles = (theme) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    backgroundImage: `linear-gradient(${theme.videoBackground.top}, ${theme.videoBackground.bottom} 100%)`,
    '&:before': {
      content: '""',
      position: 'absolute',
      top: -1,
      bottom: 0,
      left: -1,
      right: 0,
      border: `1px solid ${theme.videoBackground.top}`,
    },
  },
  video: {
    width: '100%',
    height: '100%',
    objectPosition: 'left top',
    '&::-webkit-media-controls': {
      display: 'none',
    },
    overflow: 'hidden',
    opacity: 0,
    transition: theme.transitions.create('opacity', {
      easing: theme.transitions.easing.easeOut,
    }),
    display: 'block',
  },
  active: {
    opacity: 1,
  },
  mirrored: {
    objectPosition: 'right top',
    transform: 'scale(-1, 1)',
  },
  blurred: {
    '& > video': {
      filter: 'blur(10px)',
      background: 'white',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      right: 0,
      background: 'rgba(255,255,255,0.7)',
    },
  },
  round: {
    // NOTE(longsleep): Additional border radius is required for Safari since it
    // cannot crop video elements on outer elements.
    borderRadius: 5,
    overflow: 'hidden',
  },
  cover: {
    objectFit: 'cover',
    objectPosition: 'center',
  },
  loader: {
    position: 'absolute',
    bottom: '50%',
    width: '10%',
    minWidth: 50,
    margin: '0 auto',
    height: 2,
  },
  extra: {
    display: 'none',
  },
  overlayText: {
    position: 'absolute',
    maxWidth: '80%',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    left: theme.spacing.unit * 2,
    top: theme.spacing.unit * 2,
    zIndex: 1,
    userSelect: 'none',
    '& > *': {
      color: 'white',
      textShadow: '0px 1px 3px rgba(0, 0, 0, 0.3)',
    },
  },
  overlayTextIcon: {
    verticalAlign: 'middle',
    display: 'inline-block',
    paddingBottom: 4,
  },
  callIcon: {
    flex: 1,
    fontSize: 46,
  },
  alternativeIcon: {
    position: 'absolute',
    margin: 'auto',
    fontSize: 32,
  },
});

class AudioVideo extends React.PureComponent {
  element = null;
  extra = null;

  constructor(props) {
    super(props);

    this.state = {
      active: false,
      audio: false,
      video: false,
      videoFacingMode: null,
    };
  }

  componentDidMount() {
    this.updateStream();
  }

  componentDidUpdate(oldProps) {
    const { stream } = this.props;

    if (stream !== oldProps.stream) {
      if (oldProps.stream) {
        // Remove event handlers from old stream.
        this.removeStreamEvents(oldProps.stream);
      }
      this.updateStream();
    }
  }

  componentWillUnmount() {
    const { stream } = this.props;
    if (stream) {
      this.removeStreamEvents(stream);
    }
    if (this.element) {
      this.clearStream(this.element);
    }
    if (this.extra) {
      this.clearStream(this.extra);
    }
  }

  updateStream() {
    const { stream } = this.props;
    this.setState({
      active: false,
    });
    if (stream) {
      // Add interesting event handlers.
      this.addStreamEvents(stream);
      if (stream.active) {
        this.setStreamAndPlay(this.element, stream);
        if (this.extra) {
          this.setStreamAndPlay(this.extra, stream);
        }
      }
      this.classifyStream(stream);
    } else {
      this.clearStream(this.element);
      if (this.extra) {
        this.clearStream(this.extra);
      }
    }
  }

  updateAudioSink(element) {
    const { audioSinkId } = this.props;

    if (audioSinkId !== undefined) {
      this.doUpdateAudioSink(element, audioSinkId);
    }
  }

  doUpdateAudioSink = memoize((element, audioSinkId) => {
    if (globalSettings.withAudioSetSinkId) {
      element.setSinkId(audioSinkId).catch(err => {
        console.warn(`failed to set audio sink ${audioSinkId}: ${err}`); // eslint-disable-line no-console
      });
    }
  })

  setStreamAndPlay(element, stream) {
    this.doSetOrUnsetStream(element, stream);
  }

  clearStream(element) {
    this.doSetOrUnsetStream(element, null);
  }

  doSetOrUnsetStream(element, stream) {
    if (!stream) {
      element.src = '';
      return;
    }
    element.srcObject = stream;

    // Autoplay is not guaranteed, so trigger play manually.
    try {
      element.play().then(() => {
        /* noop */
      }).catch(reason => {
        // Play might fail for various reasons, most of the time it is
        // interrupted when a new src is set before it could start to play.
        console.debug(`failed to play: ${reason}`, element); // eslint-disable-line no-console
      });
    } catch(err) {
      console.warn(`failed to play: ${err}`, element); // eslint-disable-line no-console
    }
  }

  addStreamEvents(stream) {
    // NOTE(longsleep): Use event handler functions, since Firefox does only
    // trigger the "on" functions for self triggered events.
    stream.onremovetrack = this.handleReset;
    stream.onaddtrack = this.handleReset;
  }

  removeStreamEvents(stream) {
    // NOTE(longsleep): Use event handler functions, since Firefox does only
    // trigger the "on" functions for self triggered events.
    stream.onremovetrack = undefined;
    stream.onaddtrack = undefined;
  }

  classifyStream(stream) {
    if (stream) {
      let audio = false;
      let video = false;
      let videoFacingMode = null;
      const tracks = stream.getTracks();
      for (let i=0; i<tracks.length; i++) {
        const track = tracks[i];
        const enabled = track.enabled;
        switch (track.kind) {
          case 'audio':
            if (!audio && enabled) {
              audio = true;
            }
            break;
          case 'video':
            if (!video && enabled) {
              video = true;
              if ('getSettings' in track) {
                const settings = track.getSettings();
                videoFacingMode = settings.facingMode;
              }
            }
            break;
        }
      }
      console.debug('classified stream', this.element, {audio, video}); // eslint-disable-line no-console
      this.setState({
        audio,
        video,
        videoFacingMode,
      });
    }
  }

  handleReset = () => {
    if (this.element) {
      const { stream } = this.props;
      this.clearStream(this.element);
      if (this.extra) {
        this.clearStream(this.extra);
      }
      if (stream) {
        if (stream.active) {
          this.setStreamAndPlay(this.element, stream);
          if (this.extra) {
            this.setStreamAndPlay(this.extra, stream);
          }
        }
        this.classifyStream(stream);
      }
    }
  }

  handleMetadata = (event) => {
    const ready = event.target.readyState !== 0;

    if (event.target instanceof HTMLVideoElement) {
      console.info('video meta data', this.element, event.target.videoWidth, // eslint-disable-line no-console
        event.target.videoHeight);
    } else {
      console.info('audio meta data', this.element);  // eslint-disable-line no-console
    }
    this.setState({
      active: ready,
    });
  }

  handleElement = (element) => {
    if (element === this.element) {
      return;
    }
    if (this.element) {
      this.element.removeEventListener('loadedmetadata', this.handleMetadata, true);
    }
    this.element = element;
    if (element) {
      this.element.autoplay = true;
      this.element.addEventListener('loadedmetadata', this.handleMetadata, true);
      this.updateAudioSink(this.element);
    }
  }

  handleExtra = (extra) => {
    if (extra === this.extra) {
      return;
    }

    this.extra = extra;
    if (extra) {
      this.extra.autoplay = true;
      this.updateAudioSink(this.extra);
    }
  }

  render() {
    const { active, video: hasVideo, audio: hasAudio, videoFacingMode } = this.state;
    const {
      classes,
      className: classNameProp,
      children,
      audio,
      mirrored,
      blurred,
      round,
      cover,
      muted,
      calling,
      id,
      user,
      ...other
    } = this.props;
    delete other.stream;
    delete other.audioSinkId;

    let mirrorVideo = mirrored;
    if (mirrorVideo && videoFacingMode && videoFacingMode !== 'user') {
      mirrorVideo = false;
    }

    const elementClassName = classNames(
      {
        [classes.mirrored]: mirrorVideo,
        [classes.video]: !audio,
        [classes.round]: round,
        [classes.cover]: cover,
        [classes.active]: active && hasVideo,
      },
    );

    let loader;
    let overlay;
    let element;
    let icon;

    if (calling) {
      loader = <LinearProgress color="secondary" variant="query" className={classes.loader}/>;
    }

    if (calling) {
      icon = <HourglassEmptyIcon className={classes.alternativeIcon}/>;
    } else if (!hasVideo && !audio) {
      // No video.
      icon = <CamOffIcon className={classes.alternativeIcon}/>;
    }

    if (user) {
      overlay = <div className={classes.overlayText}>
        <Typography variant="h5" gutterBottom>
          <DisplayNameLabel user={user} id={id}/> {
            !hasAudio ?  <MicOffIcon className={classes.overlayTextIcon}/> : null
          }
        </Typography>
      </div>;
    }

    if (audio) {
      element = (
        <React.Fragment>
          <audio
            className={elementClassName}
            ref={this.handleElement}
            muted={muted}
            playsInline
            {...other}
          >
            {children}
          </audio>
          {!calling && <CallIcon className={classes.callIcon} />}
        </React.Fragment>
      );
    } else {
      const withExtra = bugs.cannotPlayMoreThanOneUnmutedVideo;

      const extra = withExtra ? <audio
        className={classes.extra}
        ref={this.handleExtra}
        playsInline
        muted={muted}
      /> : null;

      element = (
        <React.Fragment>
          <video
            className={elementClassName}
            ref={this.handleElement}
            muted={extra ? true : muted}
            playsInline
            {...other}
          >
            {children}
          </video>
          {extra}
        </React.Fragment>
      );
    }

    return (
      <div className={classNames(classes.root, {
        [classes.blurred]: blurred,
      },
      classNameProp)}
      >
        {loader}
        {overlay}
        {element}
        {icon}
      </div>
    );
  }
}

AudioVideo.defaultProps = {
  audio: false,
  mirrored: false,
  blurred: false,
  round: false,
  cover: true,
  children: null,
  stream: null,

  muted: false,
  calling: false,
};

AudioVideo.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,

  audio: PropTypes.bool,
  mirrored: PropTypes.bool,
  blurred: PropTypes.bool,
  round: PropTypes.bool,
  cover: PropTypes.bool,
  children: PropTypes.element,
  stream: PropTypes.object,

  audioSinkId: PropTypes.string,

  muted: PropTypes.bool,
  calling: PropTypes.bool,

  id: PropTypes.string,
  user: PropTypes.object,
};

export default withStyles(styles)(AudioVideo);
