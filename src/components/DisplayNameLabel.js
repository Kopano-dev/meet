import React from 'react'; // eslint-disable-line no-unused-vars
import PropTypes from 'prop-types';

import { injectIntl, intlShape, FormattedMessage, defineMessages } from 'react-intl';

const translations = defineMessages({
  userWithIndex: {
    id: "displayNameLabel.userWithIndex.text",
    defaultMessage: "User {idx}",
  },
});

let count = 0;
const cache = new Map();

const DisplayNameLabel = React.forwardRef(function DisplayNameLabel({intl, user, id}, ref) {
  const { displayName } = user;

  if (displayName && displayName.trim() !== '') {
    return displayName;
  }
  if (!id) {
    return <FormattedMessage ref={ref} id="displayNameLabel.unknownUser.text" defaultMessage="Unknown user"></FormattedMessage>;
  }

  let idx = cache.get(id);
  if (idx === undefined) {
    idx = ++count;
    cache.set(id, idx);
  }

  return <React.Fragment ref={ref}>{intl.formatMessage(translations.userWithIndex, {idx})}</React.Fragment>;
});

DisplayNameLabel.propTypes = {
  intl: intlShape.isRequired,

  user: PropTypes.object,
  id: PropTypes.string.isRequired,
};

export default injectIntl(DisplayNameLabel);
