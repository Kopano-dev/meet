import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { withStyles } from 'material-ui/styles';
import List, { ListItem, ListItemText, ListItemSecondaryAction } from 'material-ui/List';
import Button from 'material-ui/Button';
import Avatar from 'material-ui/Avatar';
import PublicConferenceIcon from 'material-ui-icons/Group';
import Chip from 'material-ui/Chip';
import LinkIcon from 'material-ui-icons/Link';

import { writeTextToClipboard } from '../clipboard';
import { qualifyURL } from '../utils';

const styles = (theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0, // See https://bugzilla.mozilla.org/show_bug.cgi?id=1043520
    userSelect: 'none',
  },
  base: {
    overflow: 'auto',
    flex: 1,
  },
  item: {
    backgroundColor: theme.palette.background.default,
  },
  actions: {
    paddingRight: theme.spacing.unit,
  },
});

class GroupControl extends React.PureComponent {
  state = {
    url: null,
  }

  static getDerivedStateFromProps(props) {
    const { group } = props;

    return {
      url: qualifyURL(`/r/${group.scope}/${group.id}`),
    };
  }

  handleEntryClick = () => {
    //console.log('entry click');
  };

  handleCloseClick = () => {
    const { history } = this.props;

    history.push('/r/call');
  };

  handleCopyLinkClick = () => {
    const { url } = this.state;

    writeTextToClipboard(url).then(() => {
      console.debug('Copied link to clipboard', url); // eslint-disable-line no-console
    }).catch(err => {
      console.warn('Failed to copy link to clipboard', err); // eslint-disable-line no-console
    });
  };

  render() {
    const {
      classes,
      className: classNameProp,

      group,
    } = this.props;

    const className = classNames(
      classes.root,
      classNameProp,
    );

    return (
      <div className={className}>
        <div className={classes.base}>
          <List disablePadding>
            <ListItem button onClick={this.handleEntryClick} className={classes.item}>
              <Avatar>
                <PublicConferenceIcon />
              </Avatar>
              <ListItemText primary={group.id} secondary="Public group"/>
            </ListItem>
            <ListItem>
              <ListItemText>&nbsp;</ListItemText>
              <ListItemSecondaryAction className={classes.actions}>
                <Button
                  onClick={this.handleCloseClick}
                >
                  Close
                </Button> <Button
                  variant="raised"
                  color="primary"
                  onClick={this.handleEntryClick}
                >
                  Join
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText>
                <Chip
                  className={classes.chip}
                  avatar={<Avatar><LinkIcon/></Avatar>}
                  label={`Copy link of this ${group.scope}`}
                  onClick={this.handleCopyLinkClick}
                />
              </ListItemText>
            </ListItem>
          </List>
        </div>
      </div>
    );
  }
}

GroupControl.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,

  group: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
};

export default connect()(withStyles(styles)(GroupControl));
