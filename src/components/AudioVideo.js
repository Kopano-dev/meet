import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { withStyles } from 'material-ui/styles';

const styles = () => ({
  mirrored: {
    transform: 'scale(-1, 1)',
  },
});

class AudioVideo extends React.PureComponent {
  componentDidMount() {
    this.element.srcObject = this.props.stream;
  }

  componentDidUpdate() {
    this.element.srcObject = this.props.stream;
  }

  handleElement = (element) => {
    this.element = element;
    if (element && !this.props.audio) {
      element.addEventListener('loadedmetadata', event => {
        console.info('video size', this.element, event.target.videoWidth, event.target.videoHeight); // eslint-disable-line no-console
      });
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
};

AudioVideo.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,

  audio: PropTypes.bool,
  mirrored: PropTypes.bool,
  children: PropTypes.element,
  stream: PropTypes.object,
};

export default withStyles(styles)(AudioVideo);
