import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListSubheader from '@material-ui/core/ListSubheader';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import PublicConferenceIcon from '@material-ui/icons/Group';
import CallIcon from '@material-ui/icons/Call';
import IconButton from '@material-ui/core/IconButton';
import AddCallIcon from 'mdi-material-ui/PhonePlus';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import DeleteIcon from '@material-ui/icons/Delete';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';

import Moment from 'react-moment';

import Swipeout from 'rc-swipeout';
import 'rc-swipeout/assets/index.css';

import Persona from 'kpop/es/Persona';

import { injectIntl, intlShape, defineMessages, FormattedMessage } from 'react-intl';

import ContactLabel from './ContactLabel';
import ScopeLabel from './ScopeLabel';
import { removeRecentEntry } from '../actions/recents';

const styles = theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0, // See https://bugzilla.mozilla.org/show_bug.cgi?id=1043520
    userSelect: 'none',
  },
  entries: {
    overflowY: 'scroll',
    flex: 1,
    paddingBottom: 100,
  },
  entry: {
    minHeight: 68,
    overflow: 'hidden',
    '&:after': {
      content: '""',
      position: 'absolute',
      left: 72,
      bottom: 0,
      right: 0,
      height: 1,
      background: theme.palette.action.hover,
    },
  },
  entryContainer: {
    '& $actions': {
      [theme.breakpoints.up('md')]: {
        display: 'none',
      },
    },
    '&:hover $actions': {
      [theme.breakpoints.up('md')]: {
        display: 'block',
      },
    },
  },
  actions: {
    '& > *': {
      marginLeft: -12,
    },
  },
  centered: {
    textAlign: 'center',
  },
  vertialAlignMiddle: {
    verticalAlign: 'middle',
  },
  withBackground: {
    background: 'white',
  },
  deleteSwiper: {
    backgroundColor: 'red',
    color: 'white',
    minWidth: 95,
  },
});

const translations = defineMessages({
  callButtonAria: {
    id: 'recents.callButton.aria',
    defaultMessage: 'Call',
  },
  moreButtonAria: {
    id: 'recents.moreButton.aria',
    defaultMessage: 'More',
  },
  moreMenuDeleteItemLabel: {
    id: 'recents.deleteMoreMenuItem.label',
    defaultMessage: 'Delete',
  },
});

class Recents extends React.PureComponent {
  state = {};

  handleEntryClick = (entry, mode) => (event) => {
    const { onEntryClick } = this.props;

    switch (mode) {
      case 'more':
        this.setState({
          entryMenuAnchorEl: event.target,
          entry,
        });
        return;

      case 'delete':
        this.handleEntryDelete(entry)(event);
        return;

      default:
        onEntryClick(entry, entry.kind, mode);
        return;
    }
  }

  handleEntryDelete = (entry) => () => {
    const { removeRecents } = this.props;

    removeRecents(entry.rid);
  }

  handleEntryMenuClose = () => {
    this.setState({
      entryMenuAnchorEl: null,
      entry: null,
    });
  }

  handleEntryMenuClick = (mode) => (event) => {
    const { entry } = this.state;
    if (!entry) {
      return;
    }

    this.handleEntryMenuClose();
    this.handleEntryClick(entry, mode)(event);
  }

  handleCallClick = () => {
    const { onCallClick } = this.props;

    onCallClick();
  }

  render() {
    const { entryMenuAnchorEl } = this.state;
    const {
      classes,
      className: classNameProp,
      recents,
      intl,
    } = this.props;

    const className = classNames(
      classes.root,
      classNameProp,
    );

    const items = recents;

    const noRecents = items.length === 0 ? (
      <React.Fragment>
        <ListItem>
          <ListItemText>
            <Typography variant="caption" align="center">
              <FormattedMessage id="recents.callHistoryEmpty.message" defaultMessage="Your call history is empty."></FormattedMessage>
            </Typography>
          </ListItemText>
        </ListItem>
        <ListItem className={classes.centered}>
          <ListItemText>
            <IconButton color="primary" onClick={this.handleCallClick}>
              <AddCallIcon/>
            </IconButton>
            <Typography>
              <FormattedMessage id="recents.callButton.text" defaultMessage="Call"></FormattedMessage>
            </Typography>
          </ListItemText>
        </ListItem>
      </React.Fragment>
    ) : null;

    return (
      <div className={className}>
        <div className={classes.entries}>
          <List
            disablePadding
            subheader={
              <ListSubheader component="div" className={classes.withBackground}>
                <FormattedMessage id="recents.subheaderLabel" defaultMessage="Recent"></FormattedMessage> <ArrowDropDownIcon className={classes.vertialAlignMiddle}/>
              </ListSubheader>
            }
          >
            {items.map((entry) =>
              <Swipeout
                key={entry.rid}
                right={[
                  {
                    text: <Typography color="inherit" variant="button">
                      <FormattedMessage id="recents.deleteSwipeButton.text" defaultMessage="delete"></FormattedMessage>
                    </Typography>,
                    onPress: this.handleEntryDelete(entry),
                    className: classes.deleteSwiper,
                  },
                ]}
              >
                <ListItem
                  button
                  onClick={this.handleEntryClick(entry)}
                  className={classes.entry}
                  ContainerProps={{className: classes.entryContainer}}
                >
                  <RecentsEntryPersona entry={entry}/>
                  <ListItemText
                    primary={<ContactLabel contact={entry} id={entry.id}/>}
                    secondary={<RecentsEntrySubline entry={entry}/>}
                  />
                  <ListItemSecondaryAction className={classes.actions}>
                    <IconButton aria-label={intl.formatMessage(translations.callButtonAria)} onClick={this.handleEntryClick(entry, 'default')}>
                      <CallIcon />
                    </IconButton>
                    <IconButton aria-label={intl.formatMessage(translations.moreButtonAria)} onClick={this.handleEntryClick(entry, 'more')}>
                      <MoreVertIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </Swipeout>
            )}
            {noRecents}
          </List>
          <Menu
            anchorEl={entryMenuAnchorEl}
            open={Boolean(entryMenuAnchorEl)}
            onClose={this.handleEntryMenuClose}
          >
            <MenuItem onClick={this.handleEntryMenuClick('delete')}>
              <ListItemIcon>
                <DeleteIcon />
              </ListItemIcon>
              <ListItemText inset primary={intl.formatMessage(translations.moreMenuDeleteItemLabel)} />
            </MenuItem>
          </Menu>
        </div>
      </div>
    );
  }
}

Recents.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,
  intl: intlShape.isRequired,

  recents: PropTypes.array.isRequired,
  table: PropTypes.object.isRequired,

  onEntryClick: PropTypes.func.isRequired,
  onCallClick: PropTypes.func.isRequired,
  removeRecents: PropTypes.func.isRequired,
};

const mapStateToProps = state => {
  const { sorted, table } = state.recents;

  const recents = sorted.map(rid => {
    return {
      rid,
      ...table[rid],
    };
  });

  return {
    recents,
    table,
  };
};

const RecentsEntryPersona = ({ entry }) => {
  switch (entry.kind) {
    case 'group':
      return <Persona user={mapGroupEntryToUserShape(entry)} forceIcon icon={<PublicConferenceIcon/>}/>;

    default:
      return <Persona user={mapContactEntryToUserShape(entry)}/>;
  }
};

RecentsEntryPersona.propTypes = {
  entry: PropTypes.object.isRequired,
};

const RecentsEntrySubline = ({ entry }) => {
  let prefix = null;
  switch (entry.kind) {
    case 'group': {
      prefix=<React.Fragment><ScopeLabel scope={entry.scope} capitalize/> &mdash; </React.Fragment>;
      break;
    }
  }

  return <React.Fragment>
    {prefix}<Tooltip
      enterDelay={500}
      placement="bottom"
      title={<Moment>{entry.date}</Moment>}
    >
      <Moment fromNow >{entry.date}</Moment>
    </Tooltip>
  </React.Fragment>;
};

RecentsEntrySubline.propTypes = {
  entry: PropTypes.object.isRequired,
};

export const mapContactEntryToUserShape = entry => {
  return {
    guid: entry.mail ? entry.mail : entry.id,
    ...entry,
  };
};

export const mapGroupEntryToUserShape = entry => {
  return {
    guid: `${entry.id}-${entry.scope}-meet-group`,
    displayName: entry.id,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    removeRecents: (rid) => {
      return dispatch(removeRecentEntry(rid));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(injectIntl(Recents)));
