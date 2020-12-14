import React from 'react';
import PropTypes from 'prop-types';

import { connect } from 'react-redux';

import Badge from '@material-ui/core/Badge';

import { getChatUnreadCountByChannelAndSession } from '../../../selectors/chats';

class ChannelChatBadge extends React.PureComponent {
  render() {
    const {
      children,
      unreadCount,
      ...other
    } = this.props;
    delete other.dispatch;
    delete other.channel;
    delete other.session;

    return <Badge badgeContent={unreadCount} {...other}>
      {children}
    </Badge>;
  }
}

ChannelChatBadge.propTypes = {
  children: PropTypes.node,
  channel: PropTypes.string.isRequired,
  session: PropTypes.string.isRequired,

  unreadCount: PropTypes.number.isRequired,
};

const mapStateToProps = (state, ownProps) => {
  const { channel, session } = ownProps;

  return {
    unreadCount: getChatUnreadCountByChannelAndSession(channel, session)(state),
  };
};

export default connect(mapStateToProps)(ChannelChatBadge);
