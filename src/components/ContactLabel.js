import React from 'react';
import PropTypes from 'prop-types';

import { injectIntl, intlShape, FormattedMessage } from 'react-intl';

const ContactLabel = ({contact, id}) => {
  let label = '';
  if (contact) {
    label = contact.displayName;
    if (!label) {
      label = contact.userPrincipalName;
    }
  }
  if (!label) {
    label = <em title={id}>
      <FormattedMessage id="contactLabel.unknown.text" defaultMessage="unknown"></FormattedMessage>
    </em>;
  }

  return <span>{label}</span>;
};

ContactLabel.propTypes = {
  intl: intlShape.isRequired,
  contact: PropTypes.object,
  id: PropTypes.string.isRequired,
};

export default injectIntl(ContactLabel);
