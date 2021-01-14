import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from 'react-intl';

import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

import Moment from 'react-moment';

import DisplayNameLabel from '../../../components/DisplayNameLabel';

import { getUserFromMessage } from './Message';

const styles = theme => ({
  root: {
    ...theme.typography.body2,
    fontSize: '0.75rem',
    lineHeight: 1.35,
    color: theme.palette.grey[500],
    marginBottom: theme.spacing(0.5),
  },
  withHeader: {
    marginTop: theme.spacing(),
  },
  ts: {
    paddingLeft: theme.spacing(),
  },
});

class System extends React.PureComponent {
  render() {
    const {
      classes,
      className: classNameProp,

      noHeader,
      message,
      ...other
    } = this.props;

    const className = classNames(
      classes.root,
      {
        [classes.withHeader]: !noHeader,
      },
      classNameProp,
    );

    let content = message.text;
    if (message.extra) {
      switch (message.extra.id) {
        case 'joined_self':
          content = <FormattedMessage
            id="chatsSystem.message.joined_self"
            defaultMessage="You have joined."
          />;
          break;

        case 'joined': {
          const displayName = <DisplayNameLabel user={getUserFromMessage(message)} id={message.sender}/>;
          content = <FormattedMessage
            id="chatsSystem.message.userJoined"
            defaultMessage="{displayName} has joined."
            values={{displayName}}
          />;
          break;
        }

        case 'left': {
          const displayName = <DisplayNameLabel user={getUserFromMessage(message)} id={message.sender}/>;
          content = <FormattedMessage
            id="chatsSystem.message.userLeft"
            defaultMessage="{displayName} has left."
            values={{displayName}}
          />;
          break;
        }

        default:
      }
    }
    if (!content) {
      return null;
    }

    return <Typography display="block" className={className} {...other}>
      {content} <span className={classes.ts}><Moment format="LT" date={message.ts} interval={0}/></span>
    </Typography>;
  }
}

System.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,

  noHeader: PropTypes.bool,
  message: PropTypes.object.isRequired,
};

export default withStyles(styles)(System);
