import React from 'react';
import PropTypes from 'prop-types';

import { injectIntl, intlShape, defineMessages } from 'react-intl';

const translations = defineMessages({
  call: {
    id: 'scopeLabel.call.label',
    defaultMessage: 'call',
  },
  group: {
    id: 'scopeLabel.group.label',
    defaultMessage: 'group',
  },
  conference: {
    id: 'scopeLabel.conference.label',
    defaultMessage: 'conference',
  },
});

export function formatScopeLabel(intl, scope, capitalize=false) {
  const msg = translations[scope];
  let label = msg ? intl.formatMessage(msg) : scope;
  if (capitalize) {
    label = label[0].toUpperCase() + label.substr(1);
  }
  return label;
}

class ScopeLabel extends React.PureComponent {
  render() {
    const { intl, scope, capitalize } = this.props;
    return formatScopeLabel(intl, scope, capitalize);
  }
}

ScopeLabel.propTypes = {
  intl: intlShape.isRequired,

  scope: PropTypes.string.isRequired,
  capitalize: PropTypes.bool,
};

export default injectIntl(ScopeLabel);
