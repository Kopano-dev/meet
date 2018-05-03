import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { withStyles } from 'material-ui/styles';
import SearchIcon from 'material-ui-icons/Search';
import List, { ListItem, ListItemText } from 'material-ui/List';
import Avatar from 'material-ui/Avatar';
import { InputAdornment } from 'material-ui/Input';
import TextField from 'material-ui/TextField';

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  search: {
  },
  contacts: {
    overflow: 'auto',
    flex: 1,
  },
};

class ContactSearch extends React.PureComponent {
  render() {
    const {
      classes,
      className: classNameProp,
      contacts,

      onContactClick,
    } = this.props;

    const className = classNames(
      classes.root,
      classNameProp,
    );

    return (
      <div className={className}>
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
        <div className={classes.contacts}>
          <List disablePadding onClick={onContactClick}>
            {contacts.map((contact) =>
              <ListItem button data-contact-id={contact.id} key={contact.id}>
                <Avatar>{contact.displayName.substr(0, 2)}</Avatar>
                <ListItemText primary={contact.displayName} secondary={contact.userPrincipalName} />
              </ListItem>
            )}
          </List>
        </div>
      </div>
    );
  }
}

ContactSearch.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,

  contacts: PropTypes.array.isRequired,

  onContactClick: PropTypes.func,
};

const mapStateToProps = state => {
  const { sorted: sortedContacts } = state.contacts;
  const { user } = state.common;

  // Base64 URL encoding required, simple conversion here. See
  // https://tools.ietf.org/html/rfc4648#section-5 for the specification.
  const subURLSafe = user.profile.sub.replace(/\+/g, '-').replace(/\//, '_');

  // Filter self from contacts.
  const sortedContactsWithoutSelf = sortedContacts.filter(contact => {
    const res = contact.id !== subURLSafe;
    return res;
  });

  return {
    contacts: sortedContactsWithoutSelf,
  };
};

export default connect(mapStateToProps)(withStyles(styles)(ContactSearch));
