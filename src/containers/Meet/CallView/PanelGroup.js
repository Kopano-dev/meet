import React from 'react';
import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';

import { injectIntl, intlShape } from 'react-intl';

import GroupControl from '../GroupControl';
import FullscreenDialog from '../../../components/FullscreenDialog';
import Invite from '../Invite';

import translations from './translations';

const styles = theme => ({
  mainView: {
    flex: 1,
    minWidth: 300,
  },
});

const PanelGroup = ({
  classes,
  intl,
  match,
  channel,
  ts,
  config,
  onEntryClick,
  oneActionClick,
  openDialog,
  openDialogs,
}) => {
  const group = {
    scope: match.params.scope,
    id: match.params.id,
  };

  return <GroupControl
    className={classes.mainView}
    onEntryClick={onEntryClick}
    onActionClick={(action, props) => {
      oneActionClick(action, props);
    }}
    channel={channel}
    ts={ts}
    group={group}
    config={config}
  >
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
        onActionClick={(action, props) => {
          oneActionClick(action, props);
        }}
        config={config}
      />
    </FullscreenDialog>
  </GroupControl>;
};

PanelGroup.propTypes = {
  classes: PropTypes.object.isRequired,
  intl: intlShape.isRequired,
  match: PropTypes.object.isRequired,

  onEntryClick: PropTypes.func.isRequired,
  oneActionClick: PropTypes.func.isRequired,
  openDialog: PropTypes.func.isRequired,
  openDialogs: PropTypes.object.isRequired,
};

export default injectIntl(withStyles(styles)(PanelGroup));
