import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { withStyles } from 'material-ui/styles';
import Grid from 'material-ui/Grid';
import CallIcon from 'material-ui-icons/Call';

import renderIf from 'render-if';

import AudioVideo from './AudioVideo';

const styles = theme => ({
  root: {
    position: 'relative',
    display: 'flex',
  },
  videocall: {
    display: 'flex',
    flex: '1',
    background: '#666',
    overflow: 'hidden',
  },
  call: {
    flex: '1',
    justifyContent: 'center',
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
  callIcon: {
    fontSize: 46,
  },
  video: {
    flex: 1,
    objectFit: 'cover',
    objectPosition: 'center',
  },
});

class CallGrid extends React.PureComponent {
  render() {
    const {
      classes,
      className: classNameProp,
      mode,
      localStream,
      remoteStreams,
    } = this.props;

    const className = classNames(
      classes.root,
      classNameProp,
    );

    const streams = [];
    if (remoteStreams.length === 0 && localStream) {
      streams.push({
        id: '',
        stream: localStream,
        muted: true,
        mirrored: true,
      });
    } else {
      remoteStreams.map(stream => {
        streams.push(stream);
        return true;
      });
    }

    return (
      <div className={className}>
        {renderIf(mode === 'videocall')(() => (
          <div className={classes.videocall}>
            {streams.map((stream) =>
              <AudioVideo
                className={classes.video}
                key={stream.id}
                autoPlay
                muted={stream.muted}
                mirrored={stream.mirrored}
                playsInline
                stream={stream.stream}
              >
              </AudioVideo>
            )}
          </div>
        ))}
        {renderIf(mode === 'call')(() => (
          <Grid className={classes.call} container alignItems="center" direction="row" justify="center">
            {streams.map((stream) =>
              <AudioVideo
                key={stream.id}
                audio
                autoPlay
                muted={stream.muted}
                stream={stream.stream}
              >
              </AudioVideo>
            )}
            <Grid item>
              <CallIcon className={classes.callIcon}/>
            </Grid>
          </Grid>
        ))}
      </div>
    );
  }
}

CallGrid.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,

  mode: PropTypes.string.isRequired,
  localStream: PropTypes.object,
  remoteStreams: PropTypes.array.isRequired,
};

const mapStateToProps = state => {
  const { audioVideoStream } = state.usermedia;

  const remoteStreams = Object.values(state.streams);

  return {
    localStream: audioVideoStream,
    remoteStreams: remoteStreams,
  };
};

export default connect(mapStateToProps)(withStyles(styles, {withTheme: true})(CallGrid));
