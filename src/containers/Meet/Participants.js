import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import CamOffIcon from '@material-ui/icons/VideocamOff';
import CompareArrowsIcon from '@material-ui/icons/CompareArrows';

import Persona from 'kpop/es/Persona';

import { injectIntl, intlShape, defineMessages, FormattedMessage } from 'react-intl';

import { getCurrentParticipants } from '../../selectors/participants';
import TalkingIcon from '../../components/TalkingIcon';

import ContactLabel from './ContactLabel';

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
  entryIcons: {
    paddingRight: 60 + theme.spacing(),
  },
  entryIcon: {
    color: theme.palette.text.hint,
    opacity: 0,
    transition: 'opacity 0.2s',
    verticalAlign: 'text-bottom',
  },
  entryIconVisible: {
    opacity: 1,
  },
  entryIconStrong: {
    color: theme.palette.grey.A400,
  },
  actions: {
    '& > *': {
      marginLeft: -12,
    },
  },
  subHeader: {
    background: 'white',
    display: 'flex',
  },
  subHeaderLabel: {
    flex: 1,
  },
  leftIcon: {
    marginRight: theme.spacing(1),
  },
});

const translations = defineMessages({
  subheaderLabel: {
    id: 'participants.subheaderLabel',
    defaultMessage: '{participants, number} {participants, plural, one {participant} other {participants} }',
  },
});

class Participants extends React.PureComponent {
  state = {};

  handleActionClick = (mode, props) => () => {
    const { onActionClick } = this.props;

    onActionClick(mode, props);
  }

  render() {
    const {
      classes,
      className: classNameProp,
      participants,
      intl,
    } = this.props;

    const className = classNames(
      classes.root,
      classNameProp,
    );

    const items = participants;

    return (
      <div className={className}>
        <div className={classes.entries}>
          <List
            disablePadding
            subheader={
              <ListSubheader component="div" className={classes.subHeader}>
                <div className={classes.subHeaderLabel}>{intl.formatMessage(translations.subheaderLabel, {participants: items.length})}</div>
                <div>
                  <Button
                    color="primary"
                    size="small"
                    onClick={this.handleActionClick('invite-group')}
                  >
                    <PersonAddIcon className={classes.leftIcon}/>
                    <FormattedMessage
                      id="participants.inviteButton.label"
                      defaultMessage="invite"
                    ></FormattedMessage>
                  </Button>
                </div>
              </ListSubheader>
            }
          >
            {items.map((entry) =>
              <ListItem
                key={entry.guid}
                className={classes.entry}
                ContainerProps={{className: classes.entryContainer}}
                classes={{
                  secondaryAction: classes.entryIcons,
                }}
              >
                <ListItemAvatar>
                  {entry.calling ?
                    <Avatar>
                      <CompareArrowsIcon />
                    </Avatar>
                    :
                    <ParticipantsEntryPersona entry={entry}/>
                  }
                </ListItemAvatar>
                <ListItemText
                  primary={<ContactLabel contact={entry} id={entry.id} isSelf={!!entry.isSelf}/>}
                />
                <ListItemSecondaryAction>
                  <TalkingIcon className={classNames(
                    classes.entryIcon, {
                      [classes.entryIconVisible]: entry.calling || !entry.audio || entry.talking,
                      [classes.entryIconStrong]: entry.talking,
                    }
                  )} audio={entry.audio} talking={entry.talking}/>
                  <CamOffIcon className={classNames(
                    classes.entryIcon, {
                      [classes.entryIconVisible]: entry.calling || !entry.video,
                    }
                  )}/>
                </ListItemSecondaryAction>
              </ListItem>
            )}
          </List>
        </div>
      </div>
    );
  }
}

Participants.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,
  intl: intlShape.isRequired,

  participants: PropTypes.array.isRequired,

  onActionClick: PropTypes.func.isRequired,
};

const mapStateToProps = state => {
  return {
    participants: getCurrentParticipants(state),
  };
};

const ParticipantsEntryPersona = React.forwardRef(function ParticipantsEntryPersona({ entry }, ref) {
  return <Persona ref={ref} user={entry}/>;
});

ParticipantsEntryPersona.propTypes = {
  entry: PropTypes.object.isRequired,
};

export default connect(mapStateToProps)(withStyles(styles)(injectIntl(Participants)));
