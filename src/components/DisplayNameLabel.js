import React from 'react'; // eslint-disable-line no-unused-vars
import PropTypes from 'prop-types';

import { injectIntl, intlShape, FormattedMessage } from 'react-intl';

let count = 0;
const cache = {
};

const DisplayNameLabel = ({user, id}) => {
  const { displayName } = user;

  if (displayName && displayName.trim() !== '') {
    return displayName;
  }
  if (!id) {
    return <FormattedMessage id="displayNameLabel.unknownUser.text" defaultMessage="Unknown user"></FormattedMessage>;
  }

  let label = cache[id];
  if (!label) {
    let idx = ++count;
    label = <FormattedMessage
      id="displayNameLabel.userWithIndex.text"
      defaultMessage="User {idx}"
      values={{idx}}
    ></FormattedMessage>;
    cache[id] = label;
  }

  return label;
};

DisplayNameLabel.propTypes = {
  intl: intlShape.isRequired,

  user: PropTypes.object,
  id: PropTypes.string.isRequired,
};

export default injectIntl(DisplayNameLabel);
