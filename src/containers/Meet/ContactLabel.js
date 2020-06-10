import React from 'react';
import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';

import { injectIntl, intlShape, FormattedMessage } from 'react-intl';
import DisplayNameLabel from '../../components/DisplayNameLabel';

const styles = {
  root: {
    wordBreak: 'break-word',
    lineHeight: '1.1em',
  },
};

const ContactLabel = React.forwardRef(function ContactLabel({classes, contact, id, isSelf}, ref) {
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
  } else {
    label = <DisplayNameLabel user={{displayName: label}} id={id} isSelf={isSelf}></DisplayNameLabel>;
  }

  return <span className={classes.root} ref={ref}>{label}</span>;
});

ContactLabel.propTypes = {
  classes: PropTypes.object.isRequired,
  intl: intlShape.isRequired,
  contact: PropTypes.object,
  id: PropTypes.string.isRequired,
  isSelf: PropTypes.bool,
};

export default injectIntl(withStyles(styles)(ContactLabel));
