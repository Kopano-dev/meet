import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';
import VideocamIcon from '@material-ui/icons/Videocam';
import CallIcon from '@material-ui/icons/Call';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Divider from '@material-ui/core/Divider';
import LinearProgress from '@material-ui/core/LinearProgress';

import Persona from 'kpop/es/Persona';
import { forceBase64URLEncoded } from 'kpop/es/utils';
import debounce from 'kpop/es/utils/debounce';

import * as lunr from 'lunr';

import { injectIntl, intlShape, defineMessages, FormattedMessage } from 'react-intl';

import { fetchAndAddContacts, searchContacts } from '../actions/contacts';
import { maybeIsABEID, idFromABEID } from '../abeid';
import { getOwnGrapiUserEntryID } from '../selectors';
import { mapContactEntryToUserShape } from './Recents';

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
    overflowY: 'scroll',
    flex: 1,
    paddingBottom: 100,
  },
  entry: {
    minHeight: 68,
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
  message: {
    minHeight: 50,
    verticalAlign: 'middle',
  },
  spinner: {
    textAlign: 'center',
    maxWidth: '50%',
    margin: '0 auto',
  },
});

const translations = defineMessages({
  searchByNamePlaceholder: {
    id: 'contactSearch.searchByNameTextField.placeholder',
    defaultMessage: 'Search by name',
  },
});

class ContactSearch extends React.PureComponent {
  constructor(props) {
    super(props);

    this.index = null;
    this.state = {
      query: '',
      results: [],
      searching: null,
    };

    if (!props.remote) {
      this.updateIndex();
    }
  }

  async componentDidUpdate(prevProps) {
    const { query } = this.state;
    const { contacts, remote } = this.props;

    if (!remote && contacts !== prevProps.contacts) {
      // Rebuild index.
      await this.updateIndex();
      if (query) {
        this.doSearch(query);
      }
    }
  }

  updateIndex = async () => {
    const { contacts } = this.props;

    return new Promise(resolve => {
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
      resolve();
    });
  };

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

  doSearch = async (value) => {
    const { id, mail, remote, fetchContactsBySearch } = this.props;
    const { searching } = this.state;

    if (remote) {
      let force = false;
      let top = 0;
      if (searching) {
        searching.cancel();
      }
      if (value === '*') {
        value = '';
        force = true;
        top = 1000; // NOTE(longsleep): This is already rather slow and needs optimized view.
      }
      if (!force && value.length < 3) {
        this.setState({
          results: [],
          searching: null,
        });
        return;
      }

      const ns = debounce(fetchContactsBySearch, 500)(value, top);
      this.setState({
        searching: ns,
      });
      ns.then(results => {
        this.setState({
          results: filterIDFromContacts(results, id, mail),
          searching: null,
        });
      }).catch(() => {
        // Ignore here and rely on action error handler.
      });
    } else {
      // Local search.
      const index = this.index;
      if (index) {
        this.setState({
          results: this.search(value),
        });
      }
    }
  }

  handleContactClick = (event) => {
    const { onEntryClick, contacts } = this.props;
    const { results } = this.state;

    let mode = undefined;
    let ref = null;

    let node = event.target;
    while (node !== event.currentTarget) {
      if (!mode && node.hasAttribute('data-contact-action')) {
        mode = node.getAttribute('data-contact-action');
      }
      if (node.hasAttribute('data-contact-ref')) {
        ref = node.getAttribute('data-contact-ref');
        break;
      }

      node = node.parentElement;
    }
    if (ref === null) {
      // Nothing found. Do nothing.
      return;
    }

    const search = ref.indexOf('s:') === 0;

    const idx =  search ? Number(ref.substr(2)) : Number(ref);
    const contact = search ? results[idx] : contacts[idx];
    if (!contact) {
      console.warn('mo data for clicked contact search reference', ref); // eslint-disable-line no-console
      return;
    }

    onEntryClick(contact, 'contact', mode);
  }

  handleActionClick = (action) => {
    const { onActionClick } = this.props;

    onActionClick(action);
  }

  handleReloadContactsClick = () => {
    const { fetchContacts } = this.props;

    fetchContacts().catch(err => {
      // Ignore errors here, let global handler do it.
      console.error('failed to fetch contacts', err); // eslint-disable-line no-console
    });
  }

  render() {
    const { query, results, searching } = this.state;
    const {
      classes,
      className: classNameProp,
      contacts,
      loading,
      error,
      embedded,
      intl,
    } = this.props;

    const className = classNames(
      classes.root,
      classNameProp,
    );

    const items = query ? results : contacts;
    let message = null;

    if (loading) {
      message = (
        <ListItem className={classes.message}>
          <ListItemText>
            <Typography variant="caption" align="center">
              {searching ?
                <FormattedMessage id="contactSearch.messageSearchingForContacts" defaultMessage="Searching for contacts ..."/>
                :
                <FormattedMessage id="contactSearch.messageLoadingContacts" defaultMessage="Loading contacts ..."/>
              }
            </Typography>
          </ListItemText>
        </ListItem>
      );
    } else if (error) {
      message = (
        <ListItem className={classes.message}>
          <ListItemText>
            <Typography variant="caption" align="center">
              <FormattedMessage id="contactSearch.failedToLoad.message" defaultMessage="Failed to load contacts."></FormattedMessage> <Button size="small" color="secondary"
                onClick={this.handleReloadContactsClick}>
                <FormattedMessage id="contactSearch.failedToLoad.retryButton.text" defaultMessage="Retry"></FormattedMessage>
              </Button>
            </Typography>
          </ListItemText>
        </ListItem>
      );
    } else if (query !== '' && items.length === 0) {
      message = (
        <ListItem className={classes.message}>
          <ListItemText>
            <Typography variant="caption" align="center">
              <FormattedMessage id="contactSearch.noMatches.message" defaultMessage="No contacts match the selected criteria."></FormattedMessage>
            </Typography>
          </ListItemText>
        </ListItem>
      );
    }

    const spinner = loading ? <ListItem>
      <ListItemText className={classes.spinner}>
        <LinearProgress color="primary" variant="query" />
      </ListItemText>
    </ListItem> : null;

    const header = <React.Fragment>
      <Paper square elevation={embedded ? 0 : 4}>
        <Toolbar className={classes.search} disableGutters={embedded}>
          <TextField
            fullWidth
            autoFocus
            value={query}
            onChange={this.handleSearch}
            placeholder={intl.formatMessage(translations.searchByNamePlaceholder)}
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
      { embedded ? null : <Toolbar className={classes.extraToolbar}>
        <Button color="primary"
          onClick={this.handleActionClick.bind(this, 'new-public-group')}>
          <FormattedMessage id="contactSearch.newPublicGroup.button.text" defaultMessage="New Public Group"></FormattedMessage>
        </Button>
      </Toolbar> }
      {embedded ? null : <Divider/>}
    </React.Fragment>;

    return (
      <div className={className}>
        {header}
        <div className={classes.contacts}>
          <List disablePadding onClick={this.handleContactClick}>
            {items.map((contact, idx) =>
              <ListItem
                ContainerComponent={ContactListItem}
                ContainerProps={{idx, search: !!query, className: classes.entryContainer}}
                button
                key={contact.id}
                className={classes.entry}
              >
                <Persona user={mapContactEntryToUserShape(contact)}/>
                <ListItemText primary={contact.displayName} secondary={contact.jobTitle} />
                <ListItemSecondaryAction className={classes.actions}>
                  <IconButton aria-label="Video call" data-contact-action="videocall">
                    <VideocamIcon />
                  </IconButton>
                  <IconButton aria-label="Audio call" data-contact-action="call">
                    <CallIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            )}
            {message}
            {spinner}
          </List>
        </div>
      </div>
    );
  }
}

ContactSearch.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,
  intl: intlShape.isRequired,

  id: PropTypes.string,
  mail: PropTypes.string,
  contacts: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.bool.isRequired,
  remote: PropTypes.bool.isRequired,

  onEntryClick: PropTypes.func.isRequired,
  onActionClick: PropTypes.func.isRequired,

  fetchContacts: PropTypes.func.isRequired,
  fetchContactsBySearch: PropTypes.func.isRequired,

  embedded: PropTypes.bool,
};

function ContactListItem(props) {
  const { idx, search, children, ...other} = props; // eslint-disable-line react/prop-types

  const ref = search ? 's:' + idx : idx;
  return <li data-contact-ref={ref} {...other}>{children}</li>;
}

const filterIDFromContacts = (contacts, id, mail) => {
  const isABEID = maybeIsABEID(id);

  return contacts.filter(contact => {
    if (id) {
      if (!isABEID) {
        // Contacts return ABEID as id. Thus we need to convert - meh :/.
        return idFromABEID(contact.id) !== id;
      }
      return contact.id !== id;
    } else {
      return contact.mail !== mail;
    }
  });
};

const mapStateToProps = state => {
  const { sorted: sortedContacts, loading, error, remote } = state.contacts;
  const { mail } = state.common.profile;

  // getOwnGrapiUserEntryID comes from OIDC which is using Base64 Standard
  // encoding while contacts come from the API which use URL encoding.
  const grapiID = getOwnGrapiUserEntryID(state);
  const id = grapiID ? forceBase64URLEncoded(grapiID) : null;

  // Filter self from sorted contacts if not remote.
  const sortedContactsWithoutSelf = remote ? [] : filterIDFromContacts(sortedContacts, id, mail);

  return {
    id,
    mail,
    contacts: sortedContactsWithoutSelf,
    loading,
    error: error ? true : false,
    remote,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchContacts: () => {
      return dispatch(fetchAndAddContacts());
    },
    fetchContactsBySearch: (term, top) => {
      return dispatch(searchContacts(term, top));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(injectIntl(ContactSearch)));
