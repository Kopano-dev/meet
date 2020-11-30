import React from 'react';
import PropTypes from 'prop-types';

import { Redirect } from 'react-router-dom';

import { withStyles } from '@material-ui/core/styles';

import ContactControl from '../ContactControl';

const styles = {
  mainView: {
    flex: 1,
    minWidth: 300,
  },
};

const PanelContact = ({
  classes,
  location,
  match,
  channel,
  onEntryClick,
  ts,
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
  />;
};

PanelContact.propTypes = {
  classes: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,

  onEntryClick: PropTypes.func.isRequired,
  ts: PropTypes.object.isRequired,
};

export default withStyles(styles)(PanelContact);
