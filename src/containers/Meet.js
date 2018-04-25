import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';

import BaseContainer from 'kpop/es/BaseContainer';
import { fetchConfig } from 'kpop/es/config/actions';
import { fetchUser, receiveUser } from 'kpop/es/oidc/actions';

import Meetscreen  from '../components/Meetscreen';
import { connectToKWM } from '../actions/kwm';

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
    }).then(() => {
      return dispatch(connectToKWM());
    }).catch(err => {
      console.error('failed to fetch config, user or kwm', err); // eslint-disable-line no-console
    });
  }

  render() {
    const { config, user, ...other } = this.props;
    const ready = config && user ? true : false;

    return (
      <BaseContainer ready={ready} {...other}>
        <Router basename="/meet">
          <Switch>
            {routes.map((route, i) => <Route key={i} {...route} />)}
            <Redirect to="/r" />
          </Switch>
        </Router>
      </BaseContainer>
    );
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
