import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';

const styles = () => ({
  root: {},
});

var AudioContext = window.AudioContext // Standard.
    || window.webkitAudioContext // Safari and old versions of Chrome
    || false;

let audioContext = null;

class VolumeMeter extends React.PureComponent {
  clipping = false;
  lastClip = 0;
  volume = 0;

  ctx = null;
  processor = null;
  mediaStreamSource = null;

  constructor(props) {
    super(props);

    this.connect();
  }

  componentDidMount() {
    const { stream } = this.props;

    this.connect(stream);
  }

  componentDidUpdate(prevProps) {
    const { stream } = this.props;

    if (stream !== prevProps.stream) {
      this.connect(stream);
    }
  }

  componentWillUnmount() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
      this.processor = null;
    }
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }
  }

  setContext = element => {
    if (element) {
      this.ctx = element.getContext('2d');
    }
  }

  createVolumeMeter = () => {
    if (audioContext === null) {
      audioContext = new AudioContext();
    }

    this.processor = audioContext.createScriptProcessor(512);
    this.processor.onaudioprocess = this.handleAudioProcess;
    this.processor.connect(audioContext.destination);
  }

  connect = (stream=null) => {
    this.clipping = false;
    this.lastClip = 0;
    this.volume = 0;

    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }

    if (stream) {
      if (!this.processor) {
        this.createVolumeMeter();
      }

      this.mediaStreamSource = audioContext.createMediaStreamSource(stream);
      this.mediaStreamSource.connect(this.processor);

      this.draw();
    }
  }

  checkClipping = () => {
    if (!this.clipping) {
      return false;
    }
    const { clipLag } = this.props;
    if ((this.lastClip + clipLag) < window.performance.now()) {
      this.clipping = false;
    }
    return this.clipping;
  }

  draw = () => {
    const ctx = this.ctx;

    if (!ctx || !this.mediaStreamSource) {
      return;
    }

    const { width, height, factor, normalColor, clippedColor, direction } = this.props;

    ctx.clearRect(0, 0, width, height);
    if (this.checkClipping()) {
      ctx.fillStyle = clippedColor;
    } else {
      ctx.fillStyle = normalColor;
    }

    switch (direction) {
      case 'horizontal':
        ctx.fillRect(0, 0, this.volume * width * factor, height);
        break;
      case 'vertical':
      default:
        ctx.fillRect(0, 0, width, this.volume * height * factor);
    }

    window.requestAnimationFrame(this.draw);
  }

  handleAudioProcess = event => {
    const { averaging, clipLevel } = this.props;

    const buf = event.inputBuffer.getChannelData(0);

    let bufLength = buf.length;
    let sum = 0;
    let x;
    // Do a root-mean-square on the samples: sum up the squares...
    for (let i=0; i<bufLength; i++) {
      x = buf[i];
      if (Math.abs(x) >= clipLevel) {
        this.clipping = true;
        this.lastClip = window.performance.now();
      }
      sum += x * x;
    }
    // ... then take the square root of the sum.
    const rms =  Math.sqrt(sum / bufLength);

    // Now smooth this out with the averaging factor applied
    // to the previous sample - take the max here because we
    // want "fast attack, slow release."
    this.volume = Math.max(rms, this.volume * averaging);
  }

  render() {
    const {
      classes,
      className: classNameProp,
      width,
      height,
    } = this.props;

    return <canvas
      ref={this.setContext}
      className={classNames(classes.root, classNameProp)}
      width={width}
      height={height}
    />;
  }
}

VolumeMeter.defaultProps = {
  width: 50,
  height: 5,
  factor: 1.4,
  normalColor: 'green',
  clippedColor: 'red',
  direction: 'horizontal',

  clipLevel: 0.98,
  averaging: 0.95,
  clipLag: 500,
};

VolumeMeter.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,

  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  factor: PropTypes.number.isRequired,
  normalColor: PropTypes.string.isRequired,
  clippedColor: PropTypes.string.isRequired,
  direction: PropTypes.oneOf(['horizontal', 'vertical']).isRequired,

  clipLevel: PropTypes.number.isRequired,
  averaging: PropTypes.number.isRequired,
  clipLag: PropTypes.number.isRequired,

  stream: PropTypes.instanceOf(MediaStream),
};

export default withStyles(styles)(VolumeMeter);
