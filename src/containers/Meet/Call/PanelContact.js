import React from 'react';
import PropTypes from 'prop-types';

import { Redirect } from 'react-router-dom';

import { withStyles } from '@material-ui/core/styles';
import Hidden from '@material-ui/core/Hidden';

import ContactControl from '../ContactControl';
import ChannelControl from '../ChannelControl';

const styles = {
  mainView: {
    flex: 1,
    minWidth: 300,
  },
  control: {
    background: 'white',
    flex: 1,
  },
};

const PanelContact = ({
  classes,
  location,
  match,
  channel,
  ts,
  config,
  onEntryClick,
  onActionClick,
}) => {
  const { entry } = location.state ? location.state : {};
  if (!entry || entry.id !== match.params.id) {
    return <Redirect to="/r/call"/>;
  }

  return <ContactControl
    className={classes.mainView}
    onEntryClick={onEntryClick}
    entry={entry}
    channel={channel}
    ts={ts}
  >
    <Hidden smDown>
      <ChannelControl
        channel={channel}
        config={config}
        className={classes.control}
        onActionClick={onActionClick}
        withInvite={false}
      />
    </Hidden>
  </ContactControl>;
};

PanelContact.propTypes = {
  classes: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,

  channel: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,

  onEntryClick: PropTypes.func.isRequired,
  onActionClick: PropTypes.func.isRequired,
  ts: PropTypes.object.isRequired,
};

export default withStyles(styles)(PanelContact);
