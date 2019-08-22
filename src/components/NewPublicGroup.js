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

import Persona from 'kpop/es/Persona';

import { injectIntl, intlShape, defineMessages, FormattedMessage } from 'react-intl';

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
    defaultMessage: 'Public group name',
  },
});

class NewPublicGroup extends React.PureComponent {
  state = {
    query: '',
  }

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
    });
  };

  handleActionClick = () => {
    const { query } = this.state;
    const { onActionClick } = this.props;

    onActionClick('view-public-group', {id: query, scope: 'group'});
  }

  render() {
    const { query } = this.state;
    const {
      classes,
      className: classNameProp,
      intl,
    } = this.props;

    const className = classNames(
      classes.root,
      classNameProp,
    );

    const valid = query.trim().length > 0;

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
                        [classes.inputFieldIconValid]: query,
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
                defaultMessage="Enter a name of the group in the field above. You can use any name. A new group will created automatically if it does not exist already. A public group can be joined by anyone who knows its name.">
              </FormattedMessage>
            </Typography>
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

  onActionClick: PropTypes.func.isRequired,
};

export default connect()(withStyles(styles)(injectIntl(NewPublicGroup)));
