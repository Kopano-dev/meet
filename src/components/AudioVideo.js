import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import CallIcon from '@material-ui/icons/Call';
import CamOffIcon from '@material-ui/icons/VideocamOff';
import CompareArrowsIcon from '@material-ui/icons/CompareArrows';
import CircularProgress from '@material-ui/core/CircularProgress';

import memoize from 'memoize-one';

import { getAudioContext } from '../base';
import { globalSettings } from '../actions/media';
import { setStreamClassification, setStreamTalking } from '../actions/meet';

import DisplayNameLabel from './DisplayNameLabel';
import TalkingIcon from './TalkingIcon';

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
    top: 'auto !important',
    bottom: 'auto !important',
    left: 'auto',
    right: 'auto',
    margin: '0 auto',
    minHeight: 42,
    minWidth: 42,
    maxHeight: 'min(45%, 200px)',
    maxWidth: 'min(45%, 200px)',
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
    left: theme.spacing(2),
    top: theme.spacing(2),
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
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  overlayTextIconVisible: {
    opacity: 1,
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

  audioContext = null;
  analyser = null;
  analyserArray = null;
  processor = null;
  source = null;

  constructor(props) {
    super(props);

    this.state = {
      active: false,
      audio: false,
      video: false,
      videoFacingMode: null,
      talking: false,
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
    } else if (stream) {
      this.doPlayIfPaused();
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
    this.clearProcessor();
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

  clearProcessor() {
    const { id, setStreamTalking } = this.props;
    const { talking } = this.state;

    if (this.source) {
      if (this.analyser) {
        try {
          this.source.disconnect(this.analyser);
        } catch(err) {
          console.error('failed to disconnect source from analyser: ' + err);
        }
        try {
          this.analyser.disconnect(this.processor);
        } catch(err) {
          console.error('failed to disconnect analyser from processor: ' + err);
        }
        this.analyser = null;
      } else {
        try {
          this.source.disconnect(this.processor);
        } catch(err) {
          console.error('failed to disconnect source from processor: ' + err);
        }
      }
      this.source = null;
      if (this.processor) {
        try {
          this.processor.disconnect(this.audioContext.destination);
        } catch(err) {
          console.error('failed to disconnect processor: ' + err);
        }
        if (this.processor.port) {
          this.processor.port.postMessage({
            shutdown: true,
          });
        }
        this.processor = null;
      }
      this.audioContext = null;
    }
    if (talking) {
      this.setState({
        talking: false,
      });
      setStreamTalking(id, false);
    }
  }

  doSetOrUnsetStream(element, stream) {
    if (!stream) {
      element.src = '';
      return;
    }
    element.srcObject = stream;

    // Autoplay is not guaranteed, so trigger play manually.
    this.doPlayIfPaused(element);
  }

  async doPlayIfPaused(element=null) {
    if (!element) {
      element = this.element;
      if (!element) {
        return;
      }
    }
    if (element.paused === false) {
      return;
    }

    try {
      return element.play().then(() => {
        /* noop */
      }).catch(reason => {
        // Play might fail for various reasons, most of the time it is
        // interrupted when a new src is set before it could start to play.
        console.debug(`failed to play: ${reason}`, element); // eslint-disable-line no-console
      });
    } catch(err) {
      throw new Error(`failed to play: ${err}`);
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
    const { id, classify, setStreamClassification } = this.props;

    this.clearProcessor();
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
          default:
        }
      }
      const classification = {
        audio,
        video,
        videoFacingMode,
      };
      console.debug('classified stream', this.element, id, classify, classification); // eslint-disable-line no-console
      this.setState(classification);
      if (classify && id) {
        setStreamClassification(id, classification);

        if (audio) {
          if (!this.audioContext) {
            this.audioContext = getAudioContext();
          }
          if (this.audioContext) {
            // NOTE(longsleep): Audio worklet support for audio processing in extra thread.
            // Unfortunately this is not supported in Safari as of now.
            try {
              this.audioContext.resume();
            } catch(err) {};
            const source = this.audioContext.createMediaStreamSource(stream);
            if (this.audioContext.audioWorklet) {
              const node = new AudioWorkletNode(this.audioContext, 'volume-meter-processor');
              node.port.onmessage = (event) => {
                // Handling data from the processor.
                if (event.data.talking !== undefined) {
                  this.handleTalkingChange(event.data.talking);
                }
              };
              node.port.postMessage({
                mode: 'talking',
              });
              this.source = source;
              this.processor = node;
              try {
                this.source.connect(this.processor);
                this.processor.connect(this.audioContext.destination);
              } catch(err) {
                console.error('failed to connect media stream to processor: ' + err);
              }
            } else {
              // Use deprecated script processor on Safari.
              const analyser = this.audioContext.createAnalyser();
              analyser.minDecibels = -46;
              analyser.smoothingTimeConstant = 0.95;
              analyser.fftSize = 256;
              const processor = this.audioContext.createScriptProcessor(512, 1, 1);
              processor.onaudioprocess = this.handleAudioProcess;
              this.source = source;
              this.analyser = analyser;
              this.analyserArray = new Uint8Array(this.analyser.frequencyBinCount);
              this.processor = processor;
              try {
                this.source.connect(this.analyser);
                this.analyser.connect(this.processor);
                this.processor.connect(this.audioContext.destination);
              } catch(err) {
                console.error('failed to connect media stream to processor: ' + err);
              }
            }
          }
        }
      }
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

  handleTalkingChange = status => {
    const { id, setStreamTalking } = this.props;
    const { talking } = this.state;

    if (status !== talking) {
      this.setState({
        talking: status,
      });
      setStreamTalking(id, status);
    }
  }

  handleAudioProcess = () => {
    const { analyser, analyserArray: array } = this;
    const { id, setStreamTalking } = this.props;
    const { talking } = this.state;

    if (analyser === null) {
      return;
    }

    analyser.getByteFrequencyData(array);

    let values = 0;
    const length = array.length;
    for (let i = 0; i < length; i++) {
      values += array[i];
    }

    const status = Math.floor(values / length) > 0;
    if (status !== talking) {
      this.setState({
        talking: status,
      });
      setStreamTalking(id, status);
    }
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
    const { active, video: hasVideo, audio: hasAudio, videoFacingMode, talking } = this.state;
    const {
      classes,
      className: classNameProp,
      audio,
      mirrored,
      blurred,
      round,
      cover,
      muted,
      calling,
      id,
      user,
      ContainerComponent,
      ContainerProps,
      ...other
    } = this.props;
    delete other.stream;
    delete other.audioSinkId;
    delete other.classify;
    delete other.setStreamClassification;
    delete other.setStreamTalking;

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
      loader = <CircularProgress color="primary" variant="indeterminate" size="22vh" thickness={2.2} disableShrink className={classes.loader}/>;
    }

    if (calling) {
      icon = <CompareArrowsIcon color="primary" className={classes.alternativeIcon}/>;
    } else if (!hasVideo && !audio) {
      // No video.
      icon = <CamOffIcon className={classes.alternativeIcon}/>;
    }

    if (user) {
      overlay = <div className={classes.overlayText}>
        <Typography variant="h5" gutterBottom>
          <DisplayNameLabel user={user} id={id}/> <TalkingIcon className={classNames(
            classes.overlayTextIcon, {
              [classes.overlayTextIconVisible]: !hasAudio || talking,
            }
          )} audio={hasAudio} talking={talking}/>
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
          </video>
          {extra}
        </React.Fragment>
      );
    }

    const ActiveContainer = ContainerComponent ? ContainerComponent : React.Fragment;
    const ActiveContainerProps = ContainerProps;

    return (
      <ActiveContainer {...{
        ...ActiveContainerProps,
      }}>
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
      </ActiveContainer>
    );
  }
}

AudioVideo.defaultProps = {
  audio: false,
  mirrored: false,
  blurred: false,
  round: false,
  cover: true,
  stream: null,
  classify: false,

  muted: false,
  calling: false,

  ContainerProps: {},
};

AudioVideo.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,

  audio: PropTypes.bool,
  mirrored: PropTypes.bool,
  blurred: PropTypes.bool,
  round: PropTypes.bool,
  cover: PropTypes.bool,
  stream: PropTypes.object,
  classify: PropTypes.bool,

  audioSinkId: PropTypes.string,

  muted: PropTypes.bool,
  calling: PropTypes.bool,

  id: PropTypes.string,
  user: PropTypes.object,

  ContainerComponent: PropTypes.node,
  ContainerProps: PropTypes.object,

  setStreamClassification: PropTypes.func.isRequired,
  setStreamTalking: PropTypes.func.isRequired,
};

const mapDispatchToProps = dispatch => bindActionCreators({
  setStreamClassification,
  setStreamTalking,
}, dispatch);

export default connect(null, mapDispatchToProps)(withStyles(styles)(AudioVideo));
