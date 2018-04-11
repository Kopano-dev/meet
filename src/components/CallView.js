import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { withStyles } from 'material-ui/styles';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Tabs, { Tab } from 'material-ui/Tabs';
import VideocallIcon from 'material-ui-icons/Videocam';
import CallIcon from 'material-ui-icons/Call';
import RoomIcon from 'material-ui-icons/Group';
import SearchIcon from 'material-ui-icons/Search';
import List, { ListItem, ListItemText } from 'material-ui/List';
import Avatar from 'material-ui/Avatar';
import { InputAdornment } from 'material-ui/Input';
import TextField from 'material-ui/TextField';

import renderIf from 'render-if';

import { fetchContacts, addContacts } from '../actions/contacts';
import { requestUserMedia } from '../actions/usermedia';
import CallGrid from './CallGrid';

const styles = () => ({
  root: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  call: {
    height: '60vh',
    background: '#ddd',
    minHeight: 100,
  },
  menu: {
  },
  tabs: {
    flexGrow: 1,
  },
  tab: {
    maxWidth: 70,
    minWidth: 70,
  },
  search: {
    margin: '0 auto',
    paddingTop: 20,
    maxWidth: 600,
    width: '100%',
  },
  contacts: {
    margin: '0 auto',
    maxWidth: 600,
    width: '100%',
    maxHeight: '60vh',
    overflow: 'auto',
  },
});

class CallView extends React.PureComponent {
  state = {
    mode: 'videocall',
  };

  componentDidMount() {
    const { fetchContacts } = this.props;
    const { mode } = this.state;
    fetchContacts().catch(() => {
      // Ignore errors here, let global handler do it.
    });

    this.requestUserMedia(mode);
  }

  handleModeChange = (event, mode) => {
    this.setState({
      mode,
    });
    this.requestUserMedia(mode);
  };

  requestUserMedia = (mode) => {
    const { requestUserMedia } = this.props;

    let video = false;
    let audio = false;
    switch (mode) {
      case 'videocall':
        video = true; // eslint-disable-line no-fallthrough
      case 'call':
        audio = true;
        break;
      default:
        throw new Error('unknown mode');
    }

    return requestUserMedia(video, audio);
  };

  render() {
    const { classes, contacts } = this.props;
    const { mode } = this.state;

    return (
      <div className={classes.root}>
        <CallGrid className={classes.call} mode={mode} />
        <div className={classes.menu}>
          <AppBar position="static" color="inherit" elevation={0}>
            <Toolbar>
              <Tabs
                value={mode}
                onChange={this.handleModeChange}
                className={classes.tabs}
                indicatorColor="primary"
                textColor="primary"
                centered
              >
                <Tab value="videocall" className={classes.tab} icon={<VideocallIcon />} />
                <Tab value="call" className={classes.tab} icon={<CallIcon />} />
                <Tab value="room" className={classes.tab} icon={<RoomIcon />} disabled />
              </Tabs>
            </Toolbar>
          </AppBar>
          <List className={classes.search} disablePadding>
            <ListItem>
              <TextField
                fullWidth
                autoFocus
                disabled
                placeholder="Search by name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </ListItem>
          </List>
          {renderIf(mode === 'videocall' || mode === 'call')(() => (
            <div className={classes.contacts}>
              <List disablePadding>
                {contacts.map((contact) =>
                  <ListItem button key={contact.id}>
                    <Avatar>{contact.displayName.substr(0, 2)}</Avatar>
                    <ListItemText primary={contact.displayName} secondary={contact.userPrincipalName} />
                  </ListItem>
                )}
              </List>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

CallView.propTypes = {
  classes: PropTypes.object.isRequired,
  contacts: PropTypes.array.isRequired,

  fetchContacts: PropTypes.func.isRequired,
  requestUserMedia: PropTypes.func.isRequired,
};

const mapStateToProps = state => {
  return {
    contacts: state.contacts.sorted,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    fetchContacts: async () => {
      const contacts = await dispatch(fetchContacts());
      await dispatch(addContacts(contacts.value));
    },
    requestUserMedia: async (video=true, audio=true) => {
      await dispatch(requestUserMedia(video, audio));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(CallView));
