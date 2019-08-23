import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Toolbar from '@material-ui/core/Toolbar';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import InputAdornment from '@material-ui/core/InputAdornment';
import Button from '@material-ui/core/Button';
import PublicConferenceIcon from '@material-ui/icons/Group';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

import Persona from 'kpop/es/Persona';

import { injectIntl, intlShape, defineMessages, FormattedMessage } from 'react-intl';

import { PUBLIC_GROUP_PREFIX, isPublicGroup } from '../utils';

const styles = theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0, // See https://bugzilla.mozilla.org/show_bug.cgi?id=1043520
  },
  search: {
    minHeight: 48,
    marginBottom: theme.spacing.unit * 2,
  },
  inputField: {
    backgroundColor: theme.palette.type === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
    padding: theme.spacing.unit,
    marginRight: theme.spacing.unit * 2,
  },
  inputFieldIcon: {
    color: '#ddd',
  },
  inputFieldIconError: {
    color: 'red',
  },
  inputFieldIconValid: {
    color: 'green',
  },
  actions: {
    marginLeft: theme.spacing.unit * 3,
    marginRight: theme.spacing.unit * 3,
  },
});

const translations = defineMessages({
  enterPublicGroupInputLabel: {
    id: 'newPublicGroup.enterPublicGroup.inputLabel',
    defaultMessage: 'Group name',
  },
  allowExternalGuestsToggleLabel: {
    id: 'newPublicGroup.allowExternalGuests.toggleLabel',
    defaultMessage: 'Allow public guest access',
  },
});

class NewPublicGroup extends React.PureComponent {
  state = {
    query: '',
    isPublic: false,
  }

  handleChange = name => event => {
    const { config } = this.props;
    const state = {
      [name]: event.target.value,
    };

    if (name === 'query') {
      let isPublic = false;
      if (isPublicGroup({id: event.target.value}, config)) {
        isPublic = true;
      }
      state.isPublic = isPublic;
    }

    this.setState(state);
  };

  handleCheckboxChange = name => event => {
    const { query } = this.state;

    const state = {
      [name]: event.target.checked,
    };

    if (name === 'isPublic') {
      let newQuery = '';
      if (event.target.checked && query.indexOf(PUBLIC_GROUP_PREFIX) !== 0) {
        newQuery = `${PUBLIC_GROUP_PREFIX}${query}`;
      }
      else if (!event.target.checked && query.indexOf(PUBLIC_GROUP_PREFIX) === 0) {
        newQuery = query.substr(PUBLIC_GROUP_PREFIX.length);
      }
      if (newQuery !== query) {
        state.query = newQuery;
      }
    }

    this.setState(state);
  }

  handleActionClick = () => {
    const { query, isPublic } = this.state;
    const { onActionClick } = this.props;

    let id = query;
    if (isPublic && query.indexOf(PUBLIC_GROUP_PREFIX) !== 0) {
      id = `${PUBLIC_GROUP_PREFIX}${query}`;
    }

    onActionClick('view-public-group', {id, scope: 'group'});
  }

  render() {
    const { query, isPublic } = this.state;
    const {
      classes,
      className: classNameProp,
      intl,
      config,
    } = this.props;

    const className = classNames(
      classes.root,
      classNameProp,
    );

    const valid = query.trim().length > 0 && query.trim() !== PUBLIC_GROUP_PREFIX;
    const withPublic = config && config.guests && config.guests.enabled;

    return (
      <div className={className}>
        <Paper square elevation={0} className={classes.paper}>
          <Toolbar className={classes.search}>
            <TextField
              autoFocus
              className={classes.inputField}
              placeholder={intl.formatMessage(translations.enterPublicGroupInputLabel)}
              value={query}
              fullWidth
              onChange={this.handleChange('query')}
              InputProps={{
                disableUnderline: true,
                autoCapitalize: 'none',
                autoCorrect: 'off',
                classes: {
                  root: classes.inputFieldRoot,
                  input: classes.inputFieldInput,
                },
                startAdornment: (
                  <InputAdornment position="start">
                    <PublicConferenceIcon color="inherit" className={classNames(
                      classes.inputFieldIcon,
                      {
                        [classes.inputFieldIconValid]: query && valid,
                        [classes.inputFieldIconError]: query && !valid,
                      }
                    )}/>
                  </InputAdornment>
                ),
              }}
            /> <Persona user={{displayName: query}} forceIcon icon={<PublicConferenceIcon/>}/>
          </Toolbar>
          <DialogContent>
            <Typography>
              <FormattedMessage
                id="newPublicGroup.helper.text"
                defaultMessage="Enter a name of the group in the field above. You can use any
                 name. A new group will created automatically if it does not exist already. The
                 group can be joined by anyone who knows its exact name.">
              </FormattedMessage>
            </Typography>
            {withPublic && <FormControlLabel
              control={
                <Switch checked={isPublic} color="secondary" onChange={this.handleCheckboxChange('isPublic')} value="true" />
              }
              label={intl.formatMessage(translations.allowExternalGuestsToggleLabel)}
            />}
          </DialogContent>
          <DialogActions className={classes.actions}>
            <Button variant="contained" color="primary" disabled={!valid} onClick={this.handleActionClick}>
              <FormattedMessage id="newPublicGroup.createButton.text" defaultMessage="Join"></FormattedMessage>
            </Button>
          </DialogActions>
        </Paper>
      </div>
    );
  }
}

NewPublicGroup.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,
  intl: intlShape.isRequired,

  config: PropTypes.object.isRequired,
  onActionClick: PropTypes.func.isRequired,
};

export default connect()(withStyles(styles)(injectIntl(NewPublicGroup)));
