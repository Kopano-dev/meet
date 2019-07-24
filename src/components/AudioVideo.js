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

import DisplayNameLabel from './DisplayNameLabel';

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
  },
  video: {
    width: '100%',
    height: '100%',
    objectPosition: 'center',
    '&::-webkit-media-controls': {
      display: 'none',
    },
    overflow: 'hidden',
    opacity: 0,
    transition: theme.transitions.create('opacity', {
      easing: theme.transitions.easing.easeOut,
    }),
  },
  active: {
    opacity: 1,
  },
  mirrored: {
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
    zIndex: 10,
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
      this.element.src = '';
    }
    if (this.extra) {
      this.extra.src = '';
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
        this.element.srcObject = stream;
        if (this.extra) {
          this.extra.srcObject = stream;
        }
      }
      this.classifyStream(stream);
    } else {
      this.element.src = '';
      if (this.extra) {
        this.extra.src = '';
      }
    }
  }

  addStreamEvents(stream) {
    stream.addEventListener('removetrack', this.handleReset, true);
    stream.addEventListener('addtrack', this.handleReset, true);
  }

  removeStreamEvents(stream) {
    stream.removeEventListener('removetrack', this.handleReset, true);
    stream.removeEventListener('addtrack', this.handleReset, true);
  }

  classifyStream(stream) {
    if (stream) {
      let audio = false;
      let video = false;
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
            }
            break;
        }
      }
      console.debug('classified stream', this.element, {audio, video}); // eslint-disable-line no-console
      this.setState({
        audio,
        video,
      });
    }
  }

  handleReset = () => {
    if (this.element) {
      const { stream } = this.props;
      this.element.src = '';
      if (this.extra) {
        this.extra.src = '';
      }
      if (stream) {
        if (stream.active) {
          this.element.srcObject = stream;
          if (this.extra) {
            this.extra.srcObject = stream;
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
      this.element.addEventListener('loadedmetadata', this.handleMetadata, true);
    }
  }

  handleExtra = (extra) => {
    if (extra === this.extra) {
      return;
    }

    this.extra = extra;
  }

  render() {
    const { active, video: hasVideo, audio: hasAudio } = this.state;
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
      conference,
      id,
      user,
      ...other
    } = this.props;
    delete other.stream;

    const elementClassName = classNames(
      {
        [classes.mirrored]: mirrored,
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
            ref={this.handleElement.bind()}
            muted={muted}
            {...other}
          >
            {children}
          </audio>
          {!calling && <CallIcon className={classes.callIcon} />}
        </React.Fragment>
      );
    } else {
      const withExtra = bugs.cannotPlayMoreThanOneUnmutedVideo && !muted && conference;

      const extra = withExtra ? <audio
        className={classes.extra}
        ref={this.handleExtra.bind()}
        autoPlay
        playsInline
        muted={muted}
      /> : null;

      element = (
        <React.Fragment>
          <video
            className={elementClassName}
            ref={this.handleElement.bind()}
            muted={extra ? true : muted}
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
  autoPlay: true,
  playsInline: true,
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

  muted: PropTypes.bool,
  autoPlay: PropTypes.bool,
  playsInline: PropTypes.bool,
  calling: PropTypes.bool,

  conference: PropTypes.bool,

  id: PropTypes.string,
  user: PropTypes.object,
};

export default withStyles(styles)(AudioVideo);
