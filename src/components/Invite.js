import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';
import MailIcon from '@material-ui/icons/Mail';
import AddIcon from '@material-ui/icons/Add';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Toolbar from '@material-ui/core/Toolbar';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Divider from '@material-ui/core/Divider';
import Chip from '@material-ui/core/Chip';
import Avatar from '@material-ui/core/Avatar';
import LockIcon from '@material-ui/icons/Lock';
import LockOpenIcon from '@material-ui/icons/LockOpen';

import { injectIntl, intlShape, defineMessages, FormattedMessage } from 'react-intl';

import { isMobile, makeGroupLink, isPublicGroup } from '../utils';

const styles = theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0, // See https://bugzilla.mozilla.org/show_bug.cgi?id=1043520
    flex: 1,
  },
  chips: {
    maxWidth: 550,
    paddingBottom: 0,
    marginLeft: -1 * theme.spacing.unit / 2,
  },
  chip: {
    margin: theme.spacing.unit / 2,
  },
  search: {
    marginBottom: theme.spacing.unit * 2,
  },
  searchField: {
    backgroundColor: theme.palette.type === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
    padding: theme.spacing.unit,
  },
  searchFieldIcon: {
    color: '#ddd',
  },
  searchFieldIconError: {
    color: 'red',
  },
  searchFieldIconValid: {
    color: 'green',
  },
  verticalDivider: {
    height: 24,
    marginTop: 2,
    marginBottom: 2,
    marginLeft: 4,
    marginRight: 4,
    width: 1,
  },
  searchFieldButton: {
    padding: 4,
  },
  actions: {
    marginLeft: theme.spacing.unit * 3,
    marginRight: theme.spacing.unit * 3,
  },
  textIcon: {
    verticalAlign: 'middle',
  },
});

const translations = defineMessages({
  inviteEmailPlaceholder: {
    id: 'invite.emailTextField.placeholder',
    defaultMessage: 'Email addresses',
  },
  inviteEmailSubject: {
    id: 'invite.email.subject.template',
    defaultMessage: 'Meet "{id}" invitation',
  },
  inviteEmailBody: {
    id: 'invite.email.body.template',
    defaultMessage: 'You are invited to join the Meet "{id}".\n\nLink: {url}\n\n',
  },
});

// Simple email regex validation. We do not particularly care that its 100% right.
const validEmailRegex = /\S+@\S+\.\S+/;
function validateEmail(email)  {
  return validEmailRegex.test(email);
}

class Invite extends React.PureComponent {
  state = {
    query: '',
    invalid: true,
    dirty: false,
    added: [],
    options: {},
  }

  handleActionClick = (action) => () => {
    const { intl, onActionClick, config } = this.props;

    switch (action) {
      case 'invite-by-mailto': {
        const { added, options } = this.state;
        const { group } = this.props;
        const url = makeGroupLink(group, options, config);

        // Create mailto link with parameters.
        const params = new URLSearchParams();
        params.append('subject', intl.formatMessage(translations.inviteEmailSubject, {id: group.id}));
        params.append('body', intl.formatMessage(translations.inviteEmailBody, {id: group.id, url}));
        const mailto = `mailto:${encodeURI(added.map(a => a.mail).join(';'))}?${params.toString().replace(/\+/g, '%20')}`;
        if (isMobile) {
          // Set our direct location on mobile. Hopefully the environment is smart
          // enough to not replace our app.
          window.location.href = mailto;
        } else {
          // Open it in new window, to avoid loosing our app when the mailto link
          // is attached to a web app. The Desktop browser is not smart enough and
          // replaces our app if a web app is registered.
          window.open(mailto);
        }
        break;
      }
    }

    onActionClick(action);
  }

  handleSearch = (event) => {
    const query = event.target.value;
    const { valid } = this.validateQuery(query);

    this.setState({
      invalid: !valid,
      dirty: query.length > 0,
      query,
    });
  }

  validateQuery = query => {
    const newQueries = query.split(/[ ,;]+/).map(q => q.trim());
    const valid = newQueries.reduce((v, q) => {
      return v && validateEmail(q);
    }, true);

    return {
      dirty: true,
      newQueries,
      valid,
    };
  }

  handleAdd = () => {
    const { query, added } = this.state;
    const { newQueries, valid} = this.validateQuery(query);

    return new Promise(resolve => {
      if (!valid) {
        this.setState({
          invalid: true,
        }, () => {
          resolve(false);
        });
        return;
      }
      const newEntries = newQueries.map(q => ({mail: q}));

      this.setState({
        query: '',
        invalid: false,
        added: [...added.filter(e => !newQueries.includes(e.mail)), ...newEntries],
      }, () => {
        resolve(true);
      });
    });
  }

  handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      this.handleAdd();
    }
  }

  handleDelete = entry => () => {
    const { added } = this.state;

    this.setState({
      added: added.filter(e => e.mail !== entry.mail),
    });
  }

  render() {
    const { query, invalid, dirty, added } = this.state;
    const {
      classes,
      className: classNameProp,
      intl,
      group,
      config,
    } = this.props;

    const className = classNames(
      classes.root,
      classNameProp,
    );

    const isPublic = isPublicGroup(group, config);

    return (
      <div className={className}>
        <Paper square elevation={0} className={classes.paper}>
          <DialogContent className={classes.chips}>
            {added.map(entry => {
              return (<Chip
                key={entry.mail}
                variant="outlined"
                size="small"
                color="secondary"
                avatar={
                  <Avatar>
                    <MailIcon />
                  </Avatar>
                }
                label={entry.mail}
                className={classes.chip}
                onDelete={this.handleDelete(entry)}
              />);
            })}
          </DialogContent>
          <Toolbar className={classes.search}>
            <TextField
              fullWidth
              autoFocus={!isMobile}
              value={query}
              error={invalid && dirty}
              onChange={this.handleSearch}
              onKeyPress={this.handleKeyPress}
              placeholder={intl.formatMessage(translations.inviteEmailPlaceholder)}
              className={classes.searchField}
              InputProps={{
                disableUnderline: true,
                spellCheck: false,
                autoCapitalize: 'none',
                autoCorrect: 'off',
                classes: {
                  root: classes.searchRoot,
                  input: classes.searchInput,
                },
                startAdornment: (
                  <InputAdornment position="start">
                    <MailIcon color="inherit" className={classNames(
                      classes.searchFieldIcon,
                      {
                        [classes.searchFieldIconError]: invalid && dirty,
                        [classes.searchFieldIconValid]: query && !invalid,
                      }
                    )}/>
                  </InputAdornment>
                ),
                endAdornment: (
                  <React.Fragment>
                    <Divider className={classes.verticalDivider} orientation="vertical" />
                    <IconButton className={classes.searchFieldButton} onClick={() => {
                      this.handleAdd().catch(() => { /* ignore */});
                    }} disabled={invalid}>
                      <AddIcon />
                    </IconButton>
                  </React.Fragment>
                ),
              }}
            />
          </Toolbar>
          <DialogContent>
            { isPublic ?
              <Typography variant="subtitle2">
                <LockOpenIcon color="primary" className={classes.textIcon}/> <FormattedMessage
                  id="invite.groupIsProtected.text"
                  defaultMessage="This group is public - guests are allowed to join.">
                </FormattedMessage>
              </Typography> :
              <Typography variant="subtitle2">
                <LockIcon color="error" className={classes.textIcon}/> <FormattedMessage
                  id="invite.groupIsPublic.text"
                  defaultMessage="This group is protected - a user account is required to join.">
                </FormattedMessage>
              </Typography>
            }
          </DialogContent>
          <DialogContent>
            <Typography>
              <FormattedMessage
                id="invite.addEmailAddressesHelper.text"
                defaultMessage="Add email addresses using the text field above to invite to this Meet. To finish, click
                 invite and email message with instructions how to join this Meet will be created in your email program
                 for review and to send the invitation message.">
              </FormattedMessage>
            </Typography>
          </DialogContent>
          <DialogActions className={classes.actions}>
            <Button color="primary" variant="contained" disabled={added.length === 0 && (dirty && invalid)} onClick={() => {
              this.handleAdd().then(this.handleActionClick('invite-by-mailto'));
            }}>
              <FormattedMessage id="invite.inviteButton.label" defaultMessage="Invite"></FormattedMessage>
            </Button>
          </DialogActions>
        </Paper>
      </div>
    );
  }
}

Invite.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,
  intl: intlShape.isRequired,

  group: PropTypes.object.isRequired,

  config: PropTypes.object.isRequired,
  onActionClick: PropTypes.func.isRequired,
};

export default withStyles(styles)(injectIntl(Invite));
