import React from 'react';
import PropTypes from 'prop-types';

import { createStyles, makeStyles } from '@material-ui/styles';
import CallIcon from '@material-ui/icons/Call';

import Timer from './Timer';

const useStyles = makeStyles(theme => createStyles({
  root: {
    ...theme.typography.button,
    fontWeight: 400,
    padding: '6px 16px',
  },
  icon: {
    verticalAlign: 'middle',
  },
}));

const ChannelDuration = (props) => {
  const { start } = props;
  const classes = useStyles();

  return <div className={classes.root}>
    <CallIcon className={classes.icon} /> <Timer start={start}/>
  </div>;
};

ChannelDuration.propTypes = {
  start: PropTypes.object.isRequired,
};

export default ChannelDuration;
