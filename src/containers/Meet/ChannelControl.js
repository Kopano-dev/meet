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
    this.setState({
      openTab: value,
    });
  }

  render() {
    const {
      children,
      classes,
      className: classNameProp,
      intl,

      channel,
      withChat,

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
          {withChat ? <Tab value="chat" className={classes.tab} icon={<ChatIcon />} label={intl.formatMessage(translations.tabLabelChat)} /> : <Tab disabled className={classes.tab}/>}
        </Tabs>
        { openTab === 'participants' ?
          <Participants className={classes.container} onActionClick={onActionClick}/> :
          <div className={classes.container}></div>
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
  withChat: PropTypes.bool,

  onActionClick: PropTypes.func.isRequired,
};

const mapStateToProps = () => {
  return {
  };
};

export default connect(mapStateToProps)(withStyles(styles)(injectIntl(ChannelControl)));
