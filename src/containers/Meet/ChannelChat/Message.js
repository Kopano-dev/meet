import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from 'react-intl';

import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';

import Moment from 'react-moment';

import { sanitize } from '../../../sanitize';
import DisplayNameLabel from '../../../components/DisplayNameLabel';

const styles = theme => ({
  root: {
    position: 'relative',
    marginLeft: theme.spacing(),
    marginRight: theme.spacing(),
    marginBottom: theme.spacing(0.5),
    minWidth: '2em',
    maxWidth: '75%',
    color: theme.palette.grey[900],
    backgroundColor: theme.palette.grey[100],
    overflow: 'inherit',
    whiteSpace: 'pre-line',
  },
  messageLeft: {
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
    '&:before': {
      position: 'absolute',
      content: '""',
      width: 8,
      height: 8,
      top: 0,
      left: -8,
      backgroundColor: theme.palette.grey[100],
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 0%)',
      zIndex: 1,
    },
    '&:after': {
      position: 'absolute',
      content: '""',
      width: 9,
      height: 9,
      top: 0,
      left: -9,
      backgroundColor: theme.palette.grey[300],
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 0%)',
    },
  },
  messageRight: {
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
    backgroundColor: '#EAF6DA',
    '&:before': {
      position: 'absolute',
      content: '""',
      width: 8,
      height: 8,
      top: 0,
      right: -8,
      backgroundColor: '#EAF6DA',
      clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 100% 0%)',
      zIndex: 1,
    },
    '&:after': {
      position: 'absolute',
      content: '""',
      width: 9,
      height: 9,
      top: 0,
      right: -9,
      backgroundColor: theme.palette.grey[300],
      clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 100% 0%)',
    },
  },
  messageWithHeader: {
    marginTop: theme.spacing() + 4,
  },
  messageHeader: {
    display: 'flex',
    paddingBottom: 4,
    '& > span': {
      fontSize: '0.7rem',
      fontWeight: 500,
      color: theme.palette.grey[900],
      flex: 1,
      lineHeight: 1.1,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
    },
    '& > div': {
      fontSize: '0.55rem',
      paddingLeft: theme.spacing(),
      color: theme.palette.grey[600],
      lineHeight: 1.45,
    },
  },
  messageContent: {
    padding: 8,
    ...theme.typography.body2,
    fontSize: '0.75rem',
    lineHeight: 1.35,
  },
  messageBody: {
    overflowWrap: 'break-word',
    '& a': {
      textDecoration: 'none',
      color: 'rgb(35, 137, 215)',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
  },
});

class ChatMessage extends React.PureComponent {
  getUserFromMessage = message => {
    const { profile } = message;

    if (profile) {
      return {
        displayName: profile.name ? profile.name : '',
      };
    }
  }

  render() {
    const {
      classes,
      className: classNameProp,

      noHeader,
      message,
      ...other
    } = this.props;

    const fromSelf = message.sender === '';
    const user = fromSelf ? null : this.getUserFromMessage(message);

    const className = classNames(
      classes.root,
      fromSelf ? classes.messageRight : classes.messageLeft,
      {
        [classes.messageWithHeader]: !noHeader,
      },
      classNameProp,
    );

    return <Card className={className} {...other}>
      <div className={classes.messageContent}>
        {!noHeader && <div className={classes.messageHeader}>
          <span>
            {fromSelf ?
              <FormattedMessage id="chatsMessage.isSelf.displayName" defaultMessage="Me"/>
              :
              <DisplayNameLabel user={user} id={message.sender}/>
            }
          </span><div><Moment format="LT" date={message.ts} interval={0}/></div>
        </div>}
        <div
          className={classes.messageBody}
          dangerouslySetInnerHTML={{
            __html: message.richText ?
              sanitize(message.richText, 'html', false, false, true)
              :
              sanitize(message.text, 'text', true, false, true),
          }}
        />
      </div>
    </Card>;
  }
}

ChatMessage.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,

  noHeader: PropTypes.bool,
  message: PropTypes.object.isRequired,
};

export default withStyles(styles)(ChatMessage);
