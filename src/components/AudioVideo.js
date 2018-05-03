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
  element = null;

  constructor(props) {
    super(props);

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
    if (stream) {
      // Add interesting event handlers.
      this.addStreamEvents(stream);
      this.element.srcObject = stream;
    } else {
      this.element.src = '';
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
      if (stream) {
        this.element.srcObject = stream;
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
