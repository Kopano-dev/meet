import React from 'react';
import PropTypes from 'prop-types';

const ContactLabel = ({contact, id}) => {
  let label = '';
  if (contact) {
    label = contact.displayName;
    if (!label) {
      label = contact.userPrincipalName;
    }
  }
  if (!label) {
    label = <em title={id}>unknown</em>;
  }

  return <span>{label}</span>;
};

ContactLabel.propTypes = {
  contact: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
};

export default ContactLabel;
