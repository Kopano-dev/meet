import React from 'react';
import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';

import ChannelControl from '../ChannelControl';

const styles = theme => ({
  control: {
    background: 'white',
    flex: 1,
  },
});

const MobilePanel = ({classes, channel, config, onActionClick, onChange}) => {
  return <ChannelControl
    channel={channel}
    config={config}
    className={classes.control}
    onActionClick={onActionClick}
    onTabChange={onChange}
  />;
};

MobilePanel.propTypes = {
  classes: PropTypes.object.isRequired,

  config: PropTypes.object.isRequired,

  channel: PropTypes.string,

  onActionClick: PropTypes.func.isRequired,
  onChange: PropTypes.func,
};

export default withStyles(styles)(MobilePanel);
