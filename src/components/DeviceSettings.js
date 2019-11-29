import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import MicIcon from '@material-ui/icons/Mic';
import SpeakerIcon from '@material-ui/icons/Speaker';
import Button  from '@material-ui/core/Button';

import { injectIntl, FormattedMessage, defineMessages, intlShape } from 'react-intl';

import debounce from 'kpop/es/utils/debounce';

import AudioVideo from './AudioVideo';
import VolumeMeter from './VolumeMeter';
import { Howling, withHowling, howlingShape } from './howling';
import { enumerateDevices, requestUserMedia, stopUserMedia, updateDeviceIds, globalSettings, supportedConstraints } from '../actions/media';
import { Typography } from '@material-ui/core';

const deviceCache = {
  videoinput: 0,
  audioinput: 0,
  audiooutput: 0,
  unknown: 0,
  labels: {},
};

const styles = theme => {
  return {
    root: {
    },
    container: {
      display: 'flex',
    },
    message: {
      display: 'flex',
      marginTop: theme.spacing.unit * 4,
    },
    formControl: {
      flex: 1,
      marginRight: theme.spacing.unit * 2,
    },
    suffix: {
      width: 100,
      paddingTop: 27,
      '& > *': {
        verticalAlign: 'bottom',
      },
      '& > svg': {
        verticalAlign: 'baseline',
      },
    },
    videoPreview: {
      width: 100,
      height: 60,
      display: 'inline-block',
    },
    audioMeter: {
      borderBottom: '1px dotted #ddd',
      marginLeft: theme.spacing.unit / 2,
    },
  };
};

const unknownDeviceLabels = defineMessages({
  videoinput: {
    id: 'deviceSettings.unknownVideoInput.label',
    defaultMessage: 'Camera {number}',
  },
  audioinput: {
    id: 'deviceSettings.unknownAudioInput.label',
    defaultMessage: 'Microphone {number}',
  },
  audiooutput: {
    id: 'deviceSettings.unknownAudioOutput.label',
    defaultMessage: 'Speaker {number}',
  },
});

const translations = defineMessages({
  defaultSpeakerLabel: {
    id: 'deviceSettings.defaultSpeaker.label',
    defaultMessage: 'Default speaker',
  },
});

const DeviceLabel = ({device}) => {
  if (device.label) {
    return device.label;
  }

  const id = `${device.kind}_${device.deviceId}`;
  const entry = deviceCache.labels[id];
  if (!entry) {
    deviceCache.labels[id] = {label: ''+(++deviceCache.unknown)};
    return deviceCache.labels[id].label;
  }
  return entry.label;
};

class DeviceSettings extends React.PureComponent {
  active = true;
  handler = null;
  rum = null;
  dest = null;
  audio = null;

  localStreamID = 'device-settings';

  constructor(props) {
    super(props);

    this.state = {
      videoinputs: [],
      audioinputs: [],
      audiooutputs: [],
      known: {},

      videoSourceId: props.videoSourceId ? props.videoSourceId : '',
      audioSourceId: props.audioSourceId ? props.audioSourceId : '',
      audioSinkId: props.audioSinkId ? props.audioSinkId : '',

      stream: null,
      rumFailed: false,

      inputSelectDisabled: false,
      outputSelectDisabled: false,

      testSpeaker: false,

      dirty: false,
    };
  }

  componentDidMount() {
    const { howling } = this.props;

    if (navigator.mediaDevices) {
      this.handler = navigator.mediaDevices.addEventListener('devicechange', () => {
        this.enumerateDevices();
      });
    }

    this.enumerateDevices(true);

    if (globalSettings.withAudioSetSinkId && howling && howling.global && howling.global.usingWebAudio) {
      const { ctx, masterGain } = howling.global;

      const dest = this.dest = ctx.createMediaStreamDestination();
      masterGain.disconnect(ctx.destination);
      masterGain.connect(dest);
      const audio = this.audio = new Audio();
      audio.autoplay = true;
      audio.srcObject = dest.stream;

      this.appplyAudioSinkId();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { videoSourceId, audioSourceId, audioSinkId } = this.state;
    if (videoSourceId !== prevState.videoSourceId || audioSourceId !== prevState.audioSourceId) {
      // request gUM.
      this.requestUserMedia();
    }
    if (audioSinkId !== prevState.audioSinkId) {
      this.appplyAudioSinkId();
    }
  }

  componentWillUnmount() {
    const { howling } = this.props;

    this.active = false;

    this.stopUserMedia();

    if (this.dest) {
      const { ctx, masterGain } = howling.global;
      masterGain.disconnect(this.dest);
      masterGain.connect(ctx.destination);
      this.dest = null;
    }
    if (this.audio) {
      this.audio.src = '';
      this.audio = null;
    }
  }

  enumerateDevices = (rum=false) => {
    const { intl } = this.props;

    enumerateDevices().then(devices => {
      if (!this.active) {
        return;
      }

      const { videoSourceId, audioSourceId, audioSinkId } = this.state;

      const result = {
        videoinputs: [],
        audioinputs: [],
        audiooutputs: [],
        known: {},
      };

      for (let device of devices) {
        const id = `${device.kind}_${device.deviceId}`;
        if (result.known[id]) {
          continue; // Avoid duplicates (Firefox i am looking at you?!)
        }

        switch (device.kind) {
          case 'videoinput':
            result.videoinputs.push(device);
            break;
          case 'audioinput':
            result.audioinputs.push(device);
            break;
          case 'audiooutput':
            result.audiooutputs.push(device);
            break;
          default:
            break;
        }

        result.known[id] = true;
        if (!deviceCache.labels[id]) {
          const label = unknownDeviceLabels[device.kind];
          if (device.label || label) {
            deviceCache.labels[id] = {label: device.label ? device.label : intl.formatMessage(label, { number: ++deviceCache[device.kind] })};
          }
        }
      }

      // Ensure we have something.
      if (result.audiooutputs.length === 0) {
        result.outputSelectDisabled = true;
        result.audiooutputs.push({
          label: intl.formatMessage(translations.defaultSpeakerLabel),
          deviceId: 'default',
        });
      } else {
        result.outputSelectDisabled = !globalSettings.withAudioSetSinkId;
      }
      result.inputSelectDisabled = !supportedConstraints.deviceId;


      // Auto select first, if none selected.
      if (!videoSourceId && result.videoinputs.length) {
        result.videoSourceId = result.videoinputs[0].deviceId;
      }
      if (!audioSourceId && result.audioinputs.length) {
        result.audioSourceId = result.audioinputs[0].deviceId;
      }
      if (!audioSinkId && result.audiooutputs.length) {
        result.audioSinkId = result.audiooutputs[0].deviceId;
      }

      this.setState(result, () => {
        if (rum) {
          this.requestUserMedia();
        }
      });
    });
  }

  requestUserMedia = () => {
    const { videoSourceId, audioSourceId } = this.state;
    const { requestUserMedia } = this.props;

    if (this.rum) {
      this.rum.cancel();
      this.rum = null;
    }

    const rum = debounce(requestUserMedia, 50)(this.localStreamID, true, true, {
      video: {
        // Override/extend default settings.
        facingMode: undefined,
      },
      videoSourceId,
      audio: {
        echoCancellation: false,
        autoGainControl: false,
        noiseSuppression: false,
        channelCount: 1,
      },
      audioSourceId,
    });
    this.rum = rum;

    return rum.catch(err => {
      if (!this.active) {
        return;
      }
      console.warn('failed to access camera and/or microhone', err); // eslint-disable-line no-console
      return null;
    }).then(info => {
      if (!this.active) {
        return;
      }
      if (info && info.stream) {
        return info.stream;
      }
      return null;
    }).then(stream => {
      if (!this.active) {
        return;
      }
      this.setState({
        stream,
        rumFailed: !stream,
      });
    });
  }

  stopUserMedia = async () => {
    const { stopUserMedia } = this.props;

    if (this.rum) {
      this.rum.cancel();
      this.rum = null;
    }

    await stopUserMedia(this.localStreamID);
  }

  updateDeviceIds = async () => {
    const { audioSourceId, videoSourceId, audioSinkId } = this.state;
    const { updateDeviceIds } = this.props;

    await updateDeviceIds({
      audioSourceId,
      videoSourceId,
      audioSinkId,
    });
  }

  save = async () => {
    const { dirty } = this.state;

    if (dirty) {
      await this.updateDeviceIds();
    }
  }

  appplyAudioSinkId = async () => {
    const { audioSinkId } = this.state;
    if (globalSettings.withAudioSetSinkId) {
      return this.audio.setSinkId(audioSinkId).catch(err => {
        console.warn('failed to set audio sink', err); // eslint-disable-line no-console
      });
    }
  }

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
      dirty: true,
    });
  }

  handleSpeakerTestClick = () => {
    this.setState({
      testSpeaker: true,
    });
    setTimeout(() => {
      if (this.active) {
        this.setState({
          testSpeaker: false,
        });
      }
    }, 2000);
  }

  render() {
    const { classes, component: Component, className: classNameProp } = this.props;
    const { stream, videoinputs, audioinputs, audiooutputs, videoSourceId, audioSourceId, audioSinkId, testSpeaker, inputSelectDisabled, outputSelectDisabled, rumFailed } = this.state;

    return (
      <Component className={classNames(classes.root, classNameProp)}>
        <form autoComplete="off">
          <div className={classes.container}>
            <FormControl className={classes.formControl}>
              <InputLabel><FormattedMessage id="deviceSettings.cameraSelect.label" defaultMessage="Camera"></FormattedMessage></InputLabel>
              <Select
                value={videoSourceId}
                inputProps={{
                  name: 'camera',
                }}
                disabled={inputSelectDisabled || videoinputs.length === 0}
                onChange={this.handleChange('videoSourceId')}
              >
                {videoinputs.map(device => {
                  return <MenuItem key={device.deviceId} value={device.deviceId}><DeviceLabel device={device}/></MenuItem>;
                })}
              </Select>
            </FormControl>
            <AudioVideo
              mirrored
              stream={stream}
              muted
              className={classes.videoPreview}
            />
          </div>

          <div className={classes.container}>
            <FormControl className={classes.formControl}>
              <InputLabel><FormattedMessage id="deviceSettings.microphoneSelect.label" defaultMessage="Microphone"></FormattedMessage></InputLabel>
              <Select
                value={audioSourceId}
                inputProps={{
                  name: 'microphone',
                }}
                disabled={inputSelectDisabled || audioinputs.length === 0}
                onChange={this.handleChange('audioSourceId')}
              >
                {audioinputs.map(device => {
                  return <MenuItem key={device.deviceId} value={device.deviceId}><DeviceLabel device={device}/></MenuItem>;
                })}
              </Select>
            </FormControl>
            <div className={classes.suffix}>
              <MicIcon/>
              <VolumeMeter
                stream={stream}
                className={classes.audioMeter}
              />
            </div>
          </div>

          <div className={classes.container}>
            <FormControl className={classes.formControl}>
              <InputLabel><FormattedMessage id="deviceSettings.speakerSelect.label" defaultMessage="Speaker"></FormattedMessage></InputLabel>
              <Select
                value={audioSinkId}
                inputProps={{
                  name: 'speaker',
                }}
                disabled={outputSelectDisabled || audiooutputs.length === 0}
                onChange={this.handleChange('audioSinkId')}
              >
                {audiooutputs.map(device => {
                  return <MenuItem key={device.deviceId} value={device.deviceId}><DeviceLabel device={device}/></MenuItem>;
                })}
              </Select>
            </FormControl>
            <div className={classes.suffix}>
              <SpeakerIcon/>
              <Button size="small" color="secondary" onClick={this.handleSpeakerTestClick}>
                <FormattedMessage id="deviceSettings.speakerTestButton.label" defaultMessage="Test"></FormattedMessage>
              </Button>
              <Howling label="dial1" playing={testSpeaker}/>
            </div>
          </div>
        </form>

        { rumFailed && <div className={classes.message}>
          <Typography color="error" variant="subtitle1">
            <FormattedMessage id="deviceSettings.accessFailedMessage.text" defaultMessage="Access to camera/microphone failed. Please check permissions."></FormattedMessage>
          </Typography><Button size="small" onClick={this.requestUserMedia}>
            <FormattedMessage id="deviceSettings.retryAccessButton.label" defaultMessage="Retry"></FormattedMessage>
          </Button>
        </div> }
      </Component>
    );
  }
}

DeviceSettings.defaultProps = {
  component: 'div',
};

DeviceSettings.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,
  intl: intlShape.isRequired,
  howling: howlingShape.isRequired,

  component: PropTypes.elementType.isRequired,

  requestUserMedia: PropTypes.func.isRequired,
  stopUserMedia: PropTypes.func.isRequired,
  updateDeviceIds: PropTypes.func.isRequired,

  audioSourceId: PropTypes.string.isRequired,
  videoSourceId: PropTypes.string.isRequired,
  audioSinkId: PropTypes.string.isRequired,
};

const mapStateToProps = state => {
  const { audioSourceId, videoSourceId, audioSinkId } = state.media;

  return {
    audioSourceId,
    videoSourceId,
    audioSinkId,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    requestUserMedia: (id='', video=true, audio=true, settings={}) => {
      return dispatch(requestUserMedia(id, video, audio, settings));
    },
    stopUserMedia: (id='') => {
      return dispatch(stopUserMedia(id));
    },
    updateDeviceIds: (params) => {
      return dispatch(updateDeviceIds(params));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(withHowling(injectIntl(withStyles(styles)(DeviceSettings))));
