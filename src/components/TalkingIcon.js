import React from 'react'; // eslint-disable-line no-unused-vars
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';
import MicOffIcon from '@material-ui/icons/MicOff';
import GraphicEqIcon from '@material-ui/icons/GraphicEq';

export const styles = (theme) => ({
  root: {
  },
  audio: {
    transform: 'scaleY(0.7)',
  },
  pulse: {
    animation: '$heart-pulse 0.9s infinite ease-out',
  },
  '@keyframes heart-pulse': {
    '0%': {
      transform: 'scaleY(0.7)',
    },
    '50%': {
      transform: 'scaleY(1.0)',
    },
    '100%': {
      transform: 'scaleY(0.7)',
    },
  },
});

const TalkingIcon = React.forwardRef(function TalkingIcon({
  classes,
  className: classNameProp,

  audio,
  talking,

  ...others
}, ref) {
  const C = audio ? GraphicEqIcon : MicOffIcon;

  return <C ref={ref} className={classNames(classes.root, {
    [classes.audio]: audio,
    [classes.pulse]: talking,
  }, classNameProp)} {...others}/>;
});

TalkingIcon.propTypes = {
  classes: PropTypes.object,
  className: PropTypes.string,

  audio: PropTypes.bool.isRequired,
  talking: PropTypes.bool.isRequired,
};

export default withStyles(styles)(TalkingIcon);
