import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { withStyles } from 'material-ui/styles';
import SearchIcon from 'material-ui-icons/Search';
import List, { ListItem, ListItemText } from 'material-ui/List';
import { InputAdornment } from 'material-ui/Input';
import TextField from 'material-ui/TextField';
import Typography from 'material-ui/Typography';
import Paper from 'material-ui/Paper';
import Toolbar from 'material-ui/Toolbar';
import Button from 'material-ui/Button';
import Divider from 'material-ui/Divider';

import Persona from 'kpop/es/Persona';

import * as lunr from 'lunr';

import { forceBase64URLEncoded } from '../utils';

const styles = theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0, // See https://bugzilla.mozilla.org/show_bug.cgi?id=1043520
  },
  search: {
    minHeight: 48,
    paddingBottom: theme.spacing.unit,
  },
  searchField: {
    backgroundColor: theme.palette.type === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
    padding: theme.spacing.unit,
  },
  extraToolbar: {
    minHeight: 48,
    padding: theme.spacing.unit,
  },
  searchRoot: {
  },
  searchInput: {
  },
  contacts: {
    overflow: 'auto',
    flex: 1,
  },
});

class ContactSearch extends React.PureComponent {
  constructor(props) {
    super(props);

    this.index = null;
    this.state = {
      query: '',
      results: [],
    };

    this.updateIndex();
  }

  componentDidUpdate(prevProps) {
    const { query } = this.state;
    const { contacts } = this.props;

    if (contacts !== prevProps.contacts) {
      // Rebuild index.
      this.updateIndex();
      if (query) {
        this.doSearch(query);
      }
    }
  }

  updateIndex = () => {
    const { contacts } = this.props;

    const index = (() => {
      // NOTE(longsleep): Build index without trimmer, stemmer and stopwords.
      const builder = new lunr.Builder();

      builder.ref('idx');
      builder.field('displayName');
      builder.field('givenName');
      builder.field('surname');
      builder.field('userPrincipalName');
      builder.field('mail');

      contacts.forEach((contact, idx) => {
        builder.add({
          idx,
          ...contact,
        });
      });

      return builder.build();
    })();

    this.index = index;
  }

  search = (query) => {
    const { contacts } = this.props;
    const index = this.index;

    // NOTE(longsleep): Right now hardcodes suffix matching.
    const term = `${query.trim()}*`;

    return index.search(term).map(
      match => contacts[match.ref]
    );
  }

  handleSearch = ({target: { value }}) => {
    this.setState({
      query: value,
    });

    this.doSearch(value);
  }

  doSearch = (value) => {
    const index = this.index;
    if (index) {
      this.setState({
        results: this.search(value),
      });
    }
  }

  handleContactClick = (event) => {
    const { onContactClick } = this.props;

    if (event.target !== event.currentTarget) {
      // Climb the tree.
      let elem = event.target;
      let row = null;
      for ( ; elem && elem !== event.currentTarget; elem = elem.parentNode) {
        row = elem;
      }

      const id = row.getAttribute('data-contact-id');
      if (id) {
        onContactClick(id);
      }
    }
  }

  render() {
    const { query, results } = this.state;
    const {
      classes,
      className: classNameProp,
      contacts,
    } = this.props;

    const className = classNames(
      classes.root,
      classNameProp,
    );

    const items = query ? results : contacts;
    const noMatches = items.length === 0 ? (
      <ListItem>
        <ListItemText>
          <Typography variant="caption" align="center">
            Search result is empty.
          </Typography>
        </ListItemText>
      </ListItem>
    ) : null;

    return (
      <div className={className}>
        <Paper square elevation={4}>
          <Toolbar className={classes.search}>
            <TextField
              fullWidth
              autoFocus
              value={query}
              onChange={this.handleSearch}
              placeholder="Search by name"
              className={classes.searchField}
              InputProps={{
                disableUnderline: true,
                classes: {
                  root: classes.searchRoot,
                  input: classes.searchInput,
                },
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Toolbar>
        </Paper>
        <Toolbar className={classes.extraToolbar}>
          <Button color="primary" disabled>New Group</Button> <Button disabled color="primary">Public Groups</Button>
        </Toolbar>
        <Divider/>
        <div className={classes.contacts}>
          <List disablePadding onClick={this.handleContactClick}>
            {items.map((contact) =>
              <ListItem button data-contact-id={contact.id} key={contact.id}>
                <Persona user={mapContactToUserShape(contact)}/>
                <ListItemText primary={contact.displayName} secondary={contact.jobTitle} />
              </ListItem>
            )}
            {noMatches}
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

  // XXX(longsleep): Remove Base64 conversion once konnectd is
  // updated to use URL-safe ids. User.profile.sub comes from OIDC which is
  // using Base64 Standard encoding while contacts come from the API which
  // use URL encoding.
  const subURLSafe = forceBase64URLEncoded(user.profile.sub);

  // Filter self from contacts.
  const sortedContactsWithoutSelf = sortedContacts.filter(contact => {
    const res = contact.id !== subURLSafe;
    return res;
  });

  return {
    contacts: sortedContactsWithoutSelf,
  };
};

const mapContactToUserShape = contact => {
  return {
    // TODO(longsleep): Add iss to guid so it is globally unique.
    guid: contact.mail ? contact.mail : contact.id,
    ...contact,
  };
};

export default connect(mapStateToProps)(withStyles(styles)(ContactSearch));
