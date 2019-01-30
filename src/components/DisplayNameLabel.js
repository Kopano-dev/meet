import React from 'react';
import PropTypes from 'prop-types';

let count = 0;
const cache = {
};

const DisplayNameLabel = ({user, id}) => {
  const { displayName } = user;

  if (displayName && displayName.trim() !== '') {
    return displayName;
  }
  if (!id) {
    return 'Unknown user';
  }

  let label = cache[id];
  if (!label) {
    let idx = ++count;
    label = `User ${idx}`;
    cache[id] = label;
  }

  return label;
};

DisplayNameLabel.propTypes = {
  user: PropTypes.object,
  id: PropTypes.string.isRequired,
};

export default DisplayNameLabel;
