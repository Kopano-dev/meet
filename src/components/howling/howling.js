import React from 'react';
import PropTypes from 'prop-types';

import { howlingShape } from './types';


class Howling extends React.PureComponent {
  static contextTypes = {
    howling: howlingShape.isRequired,
  };

  sound = null;
  interval = null;

  howl({ stop } = {}) {
    const { howling } = this.context;
    const { playing, autoReset, loop, label, interval } = this.props;

    const id = this.sound ? this.sound : label;

    //console.log('xxx howl', id, playing, stop, this.sound);
    if (!stop && playing) {
      this.sound = howling.play(id);
      howling.loop(loop, this.sound);
      this.updateInterval(interval);
    } else {
      if (stop || autoReset) {
        this.updateInterval(0);
        howling.stop(id);
        this.sound = null;
      } else {
        howling.pause(id);
      }
    }
  }

  updateInterval(delay=0) { /* NOTE(longsleep): Delay in seconds */
    const { howling } = this.context;
    const { sound, interval } = this;

    if (interval !== null) {
      clearInterval(interval);
      this.interval = null;
    }
    if (delay > 0 && sound !== null) {
      this.interval = setInterval(() => {
        howling.play(sound);
      }, delay * 1000);
    }
  }

  componentDidMount() {
    this.howl();
  }

  componentDidUpdate(prevProps) {
    const { howling } = this.context;
    const { playing, loop, label, interval } = this.props;

    // Handle stuff which either triggers or stops playback.
    if (label !== prevProps.label) {
      // Label changed, stop existing and continue with new sound.
      this.howl({stop: true});
      this.howl();
    } else if (playing !== prevProps.playing) {
      // Playing changed, either start or stop.
      this.howl();
    } else if (loop !== prevProps.loop) {
      // Loop changed, set if currently a sound is set.
      if (this.sound) {
        // Playing sound, update loop value.
        howling.loop(loop, this.sound);
      }
    }

    // Interval is easy.
    if (interval !== prevProps.interval) {
      this.updateInterval(interval);
    }
  }

  componentWillUnmount() {
    this.howl({stop: true});
  }

  render() {
    // Nothing really.
    return React.createElement('div', null);
  }
}

Howling.defaultProps = {
  playing: true,
  autoReset: true,
  loop: false,
  interval: 0,
};

Howling.propTypes = {
  label: PropTypes.string,
  playing: PropTypes.bool,
  autoReset: PropTypes.bool,
  loop: PropTypes.bool,
  interval: PropTypes.number,
};

export default Howling;
