import React from 'react';
import PropTypes from 'prop-types';

import { Howl, Howler as HowlerGlobal } from 'howler';

import { howlingShape } from './types';

export const HowlingContext = React.createContext({});

export function withHowling(Component) {
  return React.forwardRef(function WithHowling(props, ref) {
    return (
      <HowlingContext.Consumer>
        {howling => <Component {...props} howling={howling} ref={ref}/>}
      </HowlingContext.Consumer>
    );
  });
}

class HowlingProvider extends React.PureComponent {
  constructor(props, context = {}) {
    super(props, context);

    const { howling: howlingContext } = props;

    const state = {
      loaded: false,
    };

    if (howlingContext) {
      state.context = howlingContext;
    } else {
      const howler = this.howler = this.createHowler();
      state.context = {
        play: howler.play.bind(howler),
        pause: howler.pause.bind(howler),
        stop: howler.stop.bind(howler),
        loop: howler.loop.bind(howler),
        howler,
        global: HowlerGlobal,
      };
    }

    this.state = state;
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
        console.error('howling provider load error', error, id); // eslint-disable-line no-console
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
      onunlock: () => {
        console.debug('howling provider now is now unlocked');  // eslint-disable-line no-console
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

  onSoundEvent(event) { // eslint-disable-line no-unused-vars
    //console.log('howler sound event', event.name, event.id);
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
    const { children } = this.props;
    const { context } = this.state;

    return (
      <HowlingContext.Provider value={context}>
        {children}
      </HowlingContext.Provider>
    );
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

  howling: howlingShape,
};

export default HowlingProvider;
