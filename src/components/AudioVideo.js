import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import VideocamIcon from '@material-ui/icons/Videocam';
import CallIcon from '@material-ui/icons/Call';

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
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
    '&::-webkit-media-controls': {
      display: 'none',
    },
    backgroundImage: `linear-gradient(${theme.videoBackground.top}, ${theme.videoBackground.bottom} 100%)`,
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
  extra: {
    display: 'none',
  },
  overlayText: {
    position: 'absolute',
    textAlign: 'center',
    maxWidth: '90%',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    left: 0,
    right: 0,
    margin: '0 auto',
    top: 24,
    zIndex: 10,
    userSelect: 'none',
    '& > *': {
      color: 'white',
      textShadow: '0px 1px 3px rgba(0, 0, 0, 0.3)',
    },
  },
  icon: {
    verticalAlign: 'middle',
  },
  callIcon: {
    flex: 1,
    fontSize: 46,
  },
});

class AudioVideo extends React.PureComponent {
  element = null;
  extra = null;

  constructor(props) {
    super(props);

    this.state = {
      active: false,
    };

    this.handleReset = this.handleReset.bind(this);
    this.handleMetadata = this.handleMetadata.bind(this);
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
  }

  updateStream() {
    const { stream } = this.props;
    this.setState({
      active: false,
    });
    if (stream) {
      // Add interesting event handlers.
      this.addStreamEvents(stream);
      this.element.srcObject = stream;
      if (this.extra) {
        this.extra.srcObject = stream;
      }
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

  handleReset() {
    if (this.element) {
      const { stream } = this.props;
      this.element.src = '';
      if (this.extra) {
        this.extra.src = '';
      }
      if (stream) {
        this.element.srcObject = stream;
        if (this.extra) {
          this.extra.srcObject = stream;
        }
      }
    }
  }

  handleMetadata(event) {
    if (event.target instanceof HTMLVideoElement) {
      console.info('video meta data', this.element, event.target.videoWidth, // eslint-disable-line no-console
        event.target.videoHeight);
    } else {
      console.info('audio meta data', this.element);  // eslint-disable-line no-console
    }
    this.setState({
      active: true,
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
    const { active } = this.state;
    const {
      classes,
      className: classNameProp,
      children,
      audio,
      mirrored,
      blurred,
      muted,
      calling,
      conference,
      user,
      ...other
    } = this.props;
    delete other.stream;

    const elementClassName = classNames(
      {
        [classes.mirrored]: mirrored,
        [classes.video]: !audio,
        [classes.active]: active,
      },
    );

    let element;
    let overlay;

    if (user) {
      overlay = <div className={classes.overlayText}>
        <Typography variant="display1" gutterBottom>
          { user.displayName }
        </Typography>
        { calling &&
          <Typography>
            { audio ? <CallIcon className={classes.icon}/> : <VideocamIcon className={classes.icon}/> } Calling ...
          </Typography>
        }
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
          <CallIcon className={classes.callIcon} />
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
        {overlay}
        {element}
      </div>
    );
  }
}

AudioVideo.defaultProps = {
  audio: false,
  mirrored: false,
  blurred: false,
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
  children: PropTypes.element,
  stream: PropTypes.object,

  muted: PropTypes.bool,
  autoPlay: PropTypes.bool,
  playsInline: PropTypes.bool,
  calling: PropTypes.bool,

  conference: PropTypes.bool,

  user: PropTypes.object,
};

export default withStyles(styles)(AudioVideo);
