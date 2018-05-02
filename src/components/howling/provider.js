import { PureComponent, Children } from 'react';
import PropTypes from 'prop-types';

import { Howl } from 'howler';

import { howlingShape } from './types';

class HowlingProvider extends PureComponent {
  static contextTypes = {
    howling: howlingShape,
  };

  static childContextTypes = {
    howling: howlingShape.isRequired,
  };

  state = {
    loaded: false,
    helpers: null,
  }

  constructor(props, context = {}) {
    super(props, context);

    const { howling: howlingContext } = context;

    if (howlingContext) {
      this.state.helpers = { ...howlingContext };
    } else {
      const howler = this.createHowler();
      this.howler = howler;
      this.state.helpers = {
        play: howler.play.bind(howler),
        pause: howler.pause.bind(howler),
        stop: howler.stop.bind(howler),
        loop: howler.loop.bind(howler),
      };
    }
  }

  createHowler() {
    const { src, sprite, format, preload, html5 } = this.props;

    const howler = new Howl({
      src,
      format,
      sprite,
      preload,
      html5,

      onload: () => {
        this.setState({
          loaded: true,
        });
      },
      onloaderror: (id , error) => {
        // NOTE(longsleep): What to do on this error? Can we retry?
        console.error('howler provider load error', error, id); // eslint-disable-line no-console
      },
      onplay: (id) => {
        this.onSoundEvent({name: 'play', id});
      },
      onplayerror: (id) => {
        this.onSoundEvent({name: 'error', id});
      },
      onstop: (id) => {
        this.onSoundEvent({name: 'stop', id});
      },
      onend: (id) => {
        this.onSoundEvent({name: 'end', id});
      },
      onpause: (id) => {
        this.onSoundEvent({name: 'pause', id});
      },
    });

    return howler;
  }

  destroyHowler(howler) {
    if (howler) {
      howler.off();
      howler.stop();
      howler.unload();
    }
  }

  onSoundEvent(event) {
    //console.log('howler sound event', event.name, event.id);
  }

  getChildContext() {
    const { helpers } = this.state;

    return {
      howling: {
        ...helpers,
        howler: this.howler, // NOTE(longsleep): Expose howler directly.
      },
    };
  }

  componentDidMount() {
  }

  componentWillUnmount() {
    if (this.howler) {
      this.destroyHowler(this.howler);
      this.howler = null;
    }
  }

  render() {
    return Children.only(this.props.children);
  }
}

HowlingProvider.defaultProps = {
  preload: true,
  html5: false,
};

HowlingProvider.propTypes = {
  children: PropTypes.element.isRequired,

  src: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]).isRequired,
  sprite: PropTypes.object,
  format: PropTypes.arrayOf(PropTypes.string),
  preload: PropTypes.bool,
  html5: PropTypes.bool,
};

export default HowlingProvider;
