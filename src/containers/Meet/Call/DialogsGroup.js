import React from 'react';
import PropTypes from 'prop-types';

import { injectIntl, intlShape } from 'react-intl';

import FullscreenDialog from '../../../components/FullscreenDialog';
import Invite from '../Invite';

import translations from './translations';

const DialogsGroup = ({
  intl,
  match,
  config,
  onActionClick,
  openDialog,
  openDialogs,
}) => {
  const group = {
    scope: match.params.scope,
    id: match.params.id,
  };

  return <React.Fragment>
    <FullscreenDialog
      topTitle={intl.formatMessage(translations.inviteDialogTopTitle, {id: group.id})}
      topElevation={0}
      responsive
      disableBackdropClick
      open={openDialogs.invite || false}
      onClose={() => { openDialog({invite: false}); }}
    >
      <Invite
        group={group}
        onActionClick={onActionClick}
        config={config}
      />
    </FullscreenDialog>
  </React.Fragment>;
};

DialogsGroup.propTypes = {
  intl: intlShape.isRequired,
  match: PropTypes.object.isRequired,

  onActionClick: PropTypes.func.isRequired,
  openDialog: PropTypes.func.isRequired,
  openDialogs: PropTypes.object.isRequired,
};

export default injectIntl(DialogsGroup);
