import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import PeopleIcon from '@material-ui/icons/PeopleAlt';
import ChatIcon from '@material-ui/icons/Chat';

import { injectIntl, intlShape, defineMessages } from 'react-intl';

import Participants from './Participants';
import ChannelChat, { ChannelChatBadge } from './ChannelChat';

const styles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0, // See https://bugzilla.mozilla.org/show_bug.cgi?id=1043520
    userSelect: 'none',
  },
  tabs: {
    borderTop: '1px solid #eee',
    borderBottom: '1px solid #eee',
  },
  tab: {
    fontSize: '.7em',
  },
  container: {
    flex: 1,
  },
});

const translations = defineMessages({
  tabLabelParticipants: {
    id: 'channelControl.tabParticipants.label',
    defaultMessage: 'Participants',
  },
  tabLabelChat: {
    id: 'channelControl.tabChat.label',
    defaultMessage: 'Chat',
  },
});

class ChannelControl extends React.PureComponent {
  state = {
    openTab: 'participants',
  }

  handleTabChange = (event, value) => {
    const { onTabChange } = this.props;

    this.setState({
      openTab: value,
    }, () => {
      if (onTabChange) {
        onTabChange(value);
      }
    });
  }

  render() {
    const {
      children,
      classes,
      className: classNameProp,
      intl,

      channel,
      withInvite,

      onActionClick,
    } = this.props;
    const {
      openTab,
    } = this.state;

    const className = classNames(
      classes.root,
      classNameProp,
    );

    if (!channel) {
      return null;
    }

    const channelChatSession = 'current';

    return (
      <div className={className}>
        <Tabs
          value={openTab}
          className={classes.tabs}
          indicatorColor="primary"
          textColor="primary"
          onChange={this.handleTabChange}
          centered
          variant="fullWidth"
        >
          <Tab value="participants" className={classes.tab} icon={<PeopleIcon />} label={intl.formatMessage(translations.tabLabelParticipants)} />
          <Tab value="chat" className={classes.tab} icon={
            <ChannelChatBadge color="primary" channel={channel} session={channelChatSession}>
              <ChatIcon />
            </ChannelChatBadge>
          } label={intl.formatMessage(translations.tabLabelChat)} />
        </Tabs>
        { openTab === 'participants' ?
          <Participants className={classes.container} onActionClick={onActionClick} withInvite={withInvite}/> :
          <ChannelChat className={classes.container} channel={channel} session={channelChatSession}/>
        }
        {children}
      </div>
    );
  }
}

ChannelControl.propTypes = {
  dispatch: PropTypes.func.isRequired,

  children: PropTypes.node,
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,
  intl: intlShape.isRequired,

  config: PropTypes.object.isRequired,

  channel: PropTypes.string,
  withInvite: PropTypes.bool,

  onActionClick: PropTypes.func.isRequired,
  onTabChange: PropTypes.func,
};

const mapStateToProps = () => {
  return {
  };
};

export default connect(mapStateToProps)(withStyles(styles)(injectIntl(ChannelControl)));
