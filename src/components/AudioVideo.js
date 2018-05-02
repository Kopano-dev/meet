import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { withStyles } from 'material-ui/styles';

const styles = () => ({
  mirrored: {
    transform: 'scale(-1, 1)',
  },

  video: {
    '&::-webkit-media-controls': {
      display: 'none',
    },
  },
});

class AudioVideo extends React.PureComponent {
  constructor(props) {
    super(props);

    this.resetElement = this.resetElement.bind(this);
  }

  componentDidMount() {
    this.updateStream();
  }

  componentDidUpdate(oldProps) {
    const { stream } = this.props;

    if (stream !== oldProps.stream) {
      if (oldProps.stream) {
        // Remove event handlers from old stream.
        oldProps.stream.removeEventListener('removetrack', this.resetElement, true);
        oldProps.stream.removeEventListener('addtrack', this.resetElement, true);
      }
      this.updateStream();
    }
  }

  componentWillUnmount() {
    const { stream } = this.props;
    if (stream) {
      // Remove event handlers.
      stream.removeEventListener('removetrack', this.resetElement, true);
      stream.removeEventListener('addtrack', this.resetElement, true);
    }
  }

  updateStream() {
    const { stream } = this.props;
    if (stream) {
      // Add interesting event handlers.
      stream.addEventListener('removetrack', this.resetElement, true);
      stream.addEventListener('addtrack', this.resetElement, true);
      this.element.srcObject = stream;
    } else {
      this.element.src = '';
    }
  }

  resetElement() {
    if (this.element) {
      const { stream } = this.props;
      this.element.src = '';
      if (stream) {
        this.element.srcObject = stream;
      }
    }
  }

  handleElement = (element) => {
    this.element = element;
    if (element) {
      if (!this.props.audio) {
        element.addEventListener('loadedmetadata', event => {
          console.info('video meta data', this.element, event.target.videoWidth, event.target.videoHeight); // eslint-disable-line no-console
        });
      } else {
        element.addEventListener('loadedmetadata', () => {
          console.info('audio meta data', this.element);  // eslint-disable-line no-console
        });
      }
    }
  }

  render() {
    const {
      classes,
      className: classNameProp,
      children,
      audio,
      mirrored,
      ...other
    } = this.props;
    delete other.stream;

    const className = classNames(
      {
        [classes.mirrored]: mirrored,
        [classes.video]: !audio,
      },
      classNameProp,
    );

    if (audio) {
      return (
        <audio
          className={className}
          ref={this.handleElement.bind()}
          {...other}
        >
          {children}
        </audio>
      );
    } else {
      return (
        <video
          className={className}
          ref={this.handleElement.bind()}
          {...other}
        >
          {children}
        </video>
      );
    }
  }
}

AudioVideo.defaultProps = {
  audio: false,
  mirrored: false,
  children: null,
  stream: null,

  autoPlay: true,
  playsInline: true,
};

AudioVideo.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,

  audio: PropTypes.bool,
  mirrored: PropTypes.bool,
  children: PropTypes.element,
  stream: PropTypes.object,

  autoPlay: PropTypes.bool,
  playsInline: PropTypes.bool,
};

export default withStyles(styles)(AudioVideo);
