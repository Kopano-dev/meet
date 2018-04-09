import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import renderIf from 'render-if';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import Snackbar from 'material-ui/Snackbar';
import Button from 'material-ui/Button';

import Meetscreen  from '../components/Meetscreen';
import ErrorDialog from '../components/ErrorDialog';
import { fetchConfig } from '../actions/config';
import { fetchUser, receiveUser } from '../actions/auth';

const styles = () => ({
  root: {
    height: '100vh',
  },
});

const routes = [
  {
    path: '/r/:view(call)?',
    exact: true,
    component: Meetscreen,
  },
];

class App extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;

    dispatch(fetchConfig('meet')).then(config => {
      // Check if user was provided in configuration.
      if (config.user) {
        return dispatch(receiveUser(config.user));
      } else {
        return dispatch(fetchUser());
      }
    }).catch(err => {
      console.error('failed to fetch config and user', err); // eslint-disable-line no-console
    });
  }

  render() {
    const { classes, config, user, error, updateAvailable } = this.props;
    const ready = config && user;
    return (
      <div className={classes.root}>
        {renderIf(ready)(() => (
          <Router basename="/meet">
            <Switch>
              {routes.map((route, i) => <Route key={i} {...route} />)}
              <Redirect to="/r" />
            </Switch>
          </Router>
        ))}
        {renderIf(!ready)(() => (
          <div id="loader">Initializing...</div>
        ))}
        {renderIf(error && error.fatal)(() => (
          <ErrorDialog open />
        ))}
        {renderIf(updateAvailable)(() => (
          <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left'}}
            open
            action={<Button color="secondary" size="small" onClick={(event) => this.reload(event)}>
              Reload
            </Button>}
            SnackbarContentProps={{
              'aria-describedby': 'message-id',
            }}
            message={<span id="message-id">Update available</span>}
          />
        ))}
      </div>
    );
  }

  reload(event) {
    event.preventDefault();

    window.location.reload();
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired,

  updateAvailable: PropTypes.bool.isRequired,
  config: PropTypes.object,
  user: PropTypes.object,
  error: PropTypes.object,

  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => {
  const { updateAvailable, config, user, error } = state.common;

  return {
    updateAvailable,
    config,
    user,
    error,
  };
};

export default connect(mapStateToProps)(withStyles(styles)(App));
