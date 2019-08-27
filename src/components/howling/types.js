import PropTypes from 'prop-types';

export const howlingShape = PropTypes.shape({
  play: PropTypes.func.isRequired,
  pause: PropTypes.func.isRequired,
  stop: PropTypes.func.isRequired,
  loop: PropTypes.func.isRequired,

  howler: PropTypes.object.isRequired,
  global: PropTypes.object.isRequired,
});
