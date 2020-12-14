import React from 'react'; // eslint-disable-line no-unused-vars
import PropTypes from 'prop-types';

import { injectIntl, intlShape, FormattedMessage, defineMessages } from 'react-intl';

import { guestDisplayNamePrefixMatcher } from '../selectors/participants';

const translations = defineMessages({
  userWithIndex: {
    id: "displayNameLabel.userWithIndex.text",
    defaultMessage: "User {idx}",
  },
  isSelfPrefix: {
    id: "displayNameLabel.isSelf.prefix",
    defaultMessage: "(Me)",
  },
  guestPrefix: {
    id: "displayNameLabel.guest.prefix",
    defaultMessage: "(Guest)",
  },
});

let count = 0;
const cache = new Map();

const DisplayNameLabel = React.forwardRef(function DisplayNameLabel({intl, user, id, isSelf}, ref) {
  let { displayName } = user ? user : {};

  if (displayName && displayName.trim() !== '') {
    const rawDisplayName = displayName.replace(guestDisplayNamePrefixMatcher, '');
    if (rawDisplayName !== displayName) {
      displayName = intl.formatMessage(translations.guestPrefix) + ' ' + rawDisplayName;
    }
    if (isSelf) {
      displayName = displayName + ' ' + intl.formatMessage(translations.isSelfPrefix);
    }
    return <React.Fragment ref={ref}>{displayName}</React.Fragment>;
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
  isSelf: PropTypes.bool,
};

export default injectIntl(DisplayNameLabel);
