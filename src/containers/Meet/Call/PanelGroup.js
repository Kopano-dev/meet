import React from 'react';
import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';
import Hidden from '@material-ui/core/Hidden';

import GroupControl from '../GroupControl';
import ChannelControl from '../ChannelControl';

const styles = theme => ({
  mainView: {
    flex: 1,
    minWidth: 300,
  },
  control: {
    background: 'white',
    flex: 1,
  },
});

const PanelGroup = ({
  classes,
  match,
  channel,
  ts,
  config,
  onEntryClick,
  onActionClick,
}) => {
  const group = {
    scope: match.params.scope,
    id: match.params.id,
  };

  return <React.Fragment>
    <GroupControl
      className={classes.mainView}
      onEntryClick={onEntryClick}
      onActionClick={onActionClick}
      channel={channel}
      ts={ts}
      group={group}
      config={config}
    >
      <Hidden smDown>
        <ChannelControl
          channel={channel}
          config={config}
          className={classes.control}
          onActionClick={onActionClick}
        />
      </Hidden>
    </GroupControl>
  </React.Fragment>;
};

PanelGroup.propTypes = {
  classes: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,

  channel: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  ts: PropTypes.object,

  onEntryClick: PropTypes.func.isRequired,
  onActionClick: PropTypes.func.isRequired,
  openDialog: PropTypes.func.isRequired,
  openDialogs: PropTypes.object.isRequired,
};

export default withStyles(styles)(PanelGroup);
