import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Slide from '@material-ui/core/Slide';
import Typography from '@material-ui/core/Typography';

import renderIf from 'render-if';

import posed from 'react-pose';

import memoize from 'memoize-one';

import { injectIntl, intlShape, FormattedMessage } from 'react-intl';

import AudioVideo from '../../components/AudioVideo';

import FloatingAudioVideo from './FloatingAudioVideo';

const defaultRemoteStreamsKey = 'stream';

const DragableFloatingAudioVideo = posed(React.forwardRef(function DragableFloatingAudioVideo(props, ref) {
  return <FloatingAudioVideo {...props} hostRef={ref}/>;
}))({
  draggable: true,
});

const styles = theme => ({
  root: {
    position: 'relative',
    display: 'flex',
    '& ::-webkit-scrollbar-track': {
      backgroundColor: 'transparent',
    },
  },
  common: {
    overflowY: 'overlay',
    overflowX: 'hidden',
  },
  videocall: {
    display: 'grid',
    backgroundImage: `linear-gradient(${theme.videoBackground.top}, ${theme.videoBackground.bottom} 100%)`,
    color: theme.palette.primary.contrastText,
    flex: 1,
    gridTemplateColumns: 'repeat(auto-fit, minmax(100%, 1fr) ) ;',
    [theme.breakpoints.up('md')]: {
      gridTemplateColumns: 'repeat(auto-fit, minmax(50%, 1fr) ) ;',
    },
    [theme.breakpoints.up('xl')]: {
      gridTemplateColumns: 'repeat(auto-fit, minmax(30%, 1fr) ) ;',
    },
  },
  call: {
    display: 'grid',
    backgroundImage: `linear-gradient(${theme.videoBackground.top}, ${theme.videoBackground.bottom} 100%)`,
    color: theme.palette.primary.contrastText,
    flex: 1,
    gridTemplateColumns: 'repeat(auto-fit, minmax(100%, 1fr) ) ;',
    [theme.breakpoints.up('md')]: {
      gridTemplateColumns: 'repeat(auto-fit, minmax(50%, 1fr) ) ;',
    },
    [theme.breakpoints.up('xl')]: {
      gridTemplateColumns: 'repeat(auto-fit, minmax(30%, 1fr) ) ;',
    },
  },
  cols3: {
    gridTemplateColumns: 'repeat(auto-fit, minmax(100%, 1fr) ) ;',
    [theme.breakpoints.up('md')]: {
      gridTemplateColumns: 'repeat(auto-fit, minmax(30%, 1fr) ) ;',
    },
  },
  audio: {
    position: 'absolute',
    zIndex: -1,
  },
  overlay: {
    alignContent: 'start',
    justifyContent: 'space-evenly',
    gridTemplateColumns: 'unset',
    minHeight: 0,
    minWidth: 0,
    overflowY: 'overlay',
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
  standby: {
    flex: '1',
    justifyContent: 'center',
    textAlign: 'center',
    color: 'white',
  },
  container: {
    position: 'relative',
    maxWidth: '100%',
    maxHeight: '100%',
    overflow: 'hidden',
    boxSizing: 'border-box',
    minHeight: 68,
    display: 'flex',
  },
  video: {
    flex: 1,
  },
  rounded: {
    width: '12vh',
    height: '12vh',
    borderRadius: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5),
    minWidth: 100,
    minHeight: 100,
    maxWidth: '12vh',
    maxHeight: '12vh',
  },
  floatingLocal: {
    position: 'absolute',
    right: theme.spacing(2),
    bottom: theme.spacing(4),
    zIndex: 5,
    minHeight: 100,
    minWidth: 100,
    boxShadow: theme.shadows[6],
  },
  floatingLocalTalking: {
    boxShadow: '0px 3px 5px -1px rgba(0,255,0,0.2),0px 6px 10px 0px rgba(44,238,144,0.14),0px 1px 18px 0px rgba(0,255,0,0.12)',
  },
  floatingOverlay: {
    maxWidth: 112,
    maxHeight: 112,
    right: 0,
    left: 0,
    margin: '0 auto',
  },
});

class CallGrid extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      remoteStreamMarker: null,
    };

    this.boundStreams = new Map();
  }

  splitStreams = memoize((remoteStreams, remoteStreamsKey, renderMode, videoOnly, remoteStreamMarker, localStream, localStreamIsRemoteFallback) => {
    const videoStreams = [];
    const audioStreams = [];
    let isFallback = false;

    if (remoteStreams.length === 0) {
      if (localStreamIsRemoteFallback && localStream) {
        videoStreams.push({
          id: '',
          stream: localStream,
          muted: true,
          mirrored: true,
        });
        isFallback = true;
      }
      return {
        videoStreams,
        audioStreams,
        isFallback,
      };
    }

    const streams = new Map();
    const boundStreams = this.boundStreams;
    remoteStreams.map(stream => {
      const s = stream[remoteStreamsKey];
      const r = {
        ...stream,
        stream: s, // Use as stream whatever the key says.
      };
      if (!videoOnly || renderMode !== 'videocall') {
        videoStreams.push(r);
      } else {
        if (s.getVideoTracks().length === 0) {
          audioStreams.push(r);
        } else {
          videoStreams.push(r);
        }
        if (s) {
          streams[s] = true;
          if (!boundStreams.has(s)) {
            s.addEventListener('addtrack', this.handleStreamAddRemoveTrack);
            s.addEventListener('removetrack', this.handleStreamAddRemoveTrack);
            boundStreams[s] = true;
          }
        }
      }

      return true;
    });

    for (const stream of boundStreams.keys()) {
      if (!streams.has(stream)) {
        boundStreams.delete(stream);
        stream.removeEventListener('addtrack', this.handleStreamAddRemoveTrack);
        stream.removeEventListener('removetrack', this.handleStreamAddRemoveTrack);
      }
    }

    return {
      videoStreams,
      audioStreams,
      isFallback,
    };
  })

  handleStreamAddRemoveTrack = () => {
    this.setState({
      remoteStreamMarker: {/* always new */},
    });
  }

  componentWillUnmount() {
    for (const stream of this.boundStreams.keys()) {
      stream.removeEventListener('addtrack', this.handleStreamAddRemoveTrack);
      stream.removeEventListener('removetrack', this.handleStreamAddRemoveTrack);
    }
    this.boundStreams.clear();
  }

  render() {
    const {
      classes,
      className: classNameProp,
      mode,
      variant,
      videoOnly,
      localStreamIsRemoteFallback,
      muted,
      cover,
      labels,
      localStream,
      localStreamTalking,
      remoteStreamsKey,
      remoteStreams,
      remoteTalkingDetection,
      audioSinkId,
      AudioVideoProps,
      intl, // eslint-disable-line no-unused-vars
      ...other
    } = this.props;
    const {
      remoteStreamMarker,
    } = this.state;

    const className = classNames(
      classes.root,
      classNameProp,
    );

    const renderMode = mode;
    const overlay = variant === 'overlay';
    const classify = remoteStreamsKey === defaultRemoteStreamsKey;
    const detectTalking = classify && remoteTalkingDetection;

    const {
      videoStreams,
      audioStreams,
      isFallback,
    } = this.splitStreams(
      remoteStreams,
      remoteStreamsKey,
      renderMode,
      videoOnly,
      remoteStreamMarker,
      localStream,
      localStreamIsRemoteFallback,
    );

    return (
      <div className={className} {...other}>
        <div className={classes.audio}>
          {audioStreams.map((stream) =>
            <AudioVideo
              key={stream.id}
              id={stream.id}
              muted={muted || stream.muted}
              stream={stream.stream}
              audioSinkId={audioSinkId}
              user={stream.user}
              calling={stream.calling}
              classify={classify}
              detectTalking={detectTalking}
              audio
            ></AudioVideo>
          )}
        </div>
        {renderIf(renderMode === 'videocall')(() => (
          <div className={classNames(
            classes.common,
            classes.videocall,
            {
              [classes.cols3]: !overlay && videoStreams.length > 10,
              [classes.overlay]: overlay,
            }
          )}>
            {videoStreams.map((stream) =>
              <AudioVideo
                key={stream.id}
                ContainerComponent="div"
                ContainerProps={{
                  className: classNames(
                    classes.container,
                    {
                      [classes.rounded]: overlay,
                    }
                  ),
                }}
                id={stream.id}
                muted={muted || stream.muted}
                mirrored={stream.mirrored}
                cover={cover}
                stream={stream.stream}
                round={!!overlay}
                user={labels ? stream.user : undefined}
                calling={stream.calling}
                classify={classify}
                detectTalking={detectTalking}
                audioSinkId={audioSinkId}
                {...AudioVideoProps}
                className={classNames(classes.video, AudioVideoProps.className)}
              >
              </AudioVideo>
            )}
          </div>
        ))}
        {renderIf(renderMode === 'call')(() => (
          <Grid className={classNames(
            classes.common,
            classes.call,
          )} container alignItems="center" direction="row" justify="center">
            {videoStreams.map((stream) =>
              <AudioVideo
                key={stream.id}
                audio
                id={stream.id}
                muted={muted || stream.muted}
                cover={cover}
                stream={stream.stream}
                user={stream.user}
                calling={stream.calling}
                classify={classify}
                detectTalking={detectTalking}
                audioSinkId={audioSinkId}
                {...AudioVideoProps}
                className={classNames(classes.video, AudioVideoProps.className)}
              >
              </AudioVideo>
            )}
          </Grid>
        ))}
        {renderIf(renderMode === 'standby')(() => (
          <Grid className={classes.standby} container alignItems="center" direction="row" justify="center">
            <Grid item>
              <Typography color="inherit" variant="h5">
                <FormattedMessage id="callGrid.suspended.headline" defaultMessage="Suspended"></FormattedMessage>
              </Typography>
            </Grid>
          </Grid>
        ))}
        <Slide direction="up" in={(remoteStreams.length > 0 || !isFallback) && !!localStream} mountOnEnter unmountOnExit>
          <DragableFloatingAudioVideo
            className={classNames(classes.floatingLocal, {
              [classes.floatingOverlay]: overlay,
              [classes.floatingLocalTalking]: localStreamTalking,
            })}
            stream={localStream}
            mirrored
            muted
            cover={cover}
          />
        </Slide>
      </div>
    );
  }
}

CallGrid.defaultProps = {
  localStream: null,

  remoteStreamsKey: defaultRemoteStreamsKey,
  variant: 'full',

  labels: true,

  AudioVideoProps: {},
};

CallGrid.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,
  intl: intlShape.isRequired,

  mode: PropTypes.oneOf(['videocall', 'call', 'standby']).isRequired,
  variant: PropTypes.oneOf(['full', 'overlay']).isRequired,
  videoOnly: PropTypes.bool,
  localStreamIsRemoteFallback: PropTypes.bool,

  cover: PropTypes.bool,
  muted: PropTypes.bool,
  labels: PropTypes.bool,

  localStream: PropTypes.object,
  localStreamTalking: PropTypes.bool,
  remoteStreamsKey: PropTypes.string.isRequired,
  remoteStreams: PropTypes.array.isRequired,
  remoteTalkingDetection: PropTypes.bool,

  audioSinkId: PropTypes.string,

  AudioVideoProps: PropTypes.object,
};

export default withStyles(styles)(injectIntl(CallGrid));
