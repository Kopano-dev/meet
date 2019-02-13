import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Button from '@material-ui/core/Button';
import VideocamIcon from '@material-ui/icons/Videocam';
import CallIcon from '@material-ui/icons/Call';

import Persona from 'kpop/es/Persona';

import { mapContactEntryToUserShape } from './Recents';
import ContactLabel from './ContactLabel';
import { pushHistory } from '../utils';

const styles = (theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0, // See https://bugzilla.mozilla.org/show_bug.cgi?id=1043520
    userSelect: 'none',
  },
  base: {
    flex: 1,
  },
  card: {
  },
  actions: {
    flex: 1,
  },
  leftIcon: {
    marginRight: theme.spacing.unit,
  },
  close: {
    marginLeft: 'auto',
    [theme.breakpoints.up('sm')]: {
      marginRight: -8,
    },
  },
});

class ContactControl extends React.PureComponent {
  handleEntryClick = (mode) => () => {
    const { entry, onEntryClick } = this.props;

    onEntryClick(entry, entry.kind, mode);
  };

  handleCloseClick = () => {
    const { history } = this.props;

    pushHistory(history, '/r/call');
  };

  render() {
    const {
      classes,
      className: classNameProp,

      entry,
    } = this.props;

    const className = classNames(
      classes.root,
      classNameProp,
    );

    return (
      <div className={className}>
        <div className={classes.base}>
          <List disablePadding>
            <ListItem>
              <Persona
                user={mapContactEntryToUserShape(entry)}
                className={classes.avatar} />
              <ListItemText primary={<ContactLabel contact={entry} id={entry.id}/>} secondary={entry.jobTitle} />
            </ListItem>
          </List>
          <Card elevation={0} className={classes.card}>
            <CardActions className={classes.actions}>
              <Button
                color="primary"
                onClick={this.handleEntryClick('videocall')}
              >
                <VideocamIcon className={classes.leftIcon} />
                Video
              </Button>
              <Button
                color="primary"
                onClick={this.handleEntryClick('call')}
              >
                <CallIcon className={classes.leftIcon} />
                Call
              </Button>
              <Button
                color="primary"
                className={classes.close}
                onClick={this.handleCloseClick}
              >Close</Button>
            </CardActions>
          </Card>
        </div>
      </div>
    );
  }
}

ContactControl.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,

  entry: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,

  onEntryClick: PropTypes.func,
};

export default connect()(withStyles(styles)(ContactControl));
