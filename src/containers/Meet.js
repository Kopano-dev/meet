import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';

import BaseContainer from 'kpop/es/BaseContainer';
import { fetchConfig } from 'kpop/es/config/actions';
import { fetchUser, receiveUser } from 'kpop/es/oidc/actions';

import { HowlingProvider } from '../components/howling';
import soundSprite1Ogg from '../sounds/sprite1.ogg';
import soundSprite1Mp3 from '../sounds/sprite1.mp3';
import soundSprite1Json from '../sounds/sprite1.json';

import Meetscreen  from '../components/Meetscreen';
import { connectToKWM } from '../actions/kwm';
import { initializeOffline } from '../actions/offline';

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
  state = {
    initialized: false,
  }

  componentDidMount() {
    const { dispatch } = this.props;

    dispatch(initializeOffline());
  }

  componentDidUpdate(prevProps) {
    const { initialized } = this.state;
    const { offline } = this.props;

    if (!initialized && offline !== prevProps.offline && !offline) {
      this.initialize().then(() => {
        console.info('app initialized'); // eslint-disable-line no-console
        this.setState({
          initialized: true,
        });
      });
    }
  }

  initialize = () => {
    const { dispatch } = this.props;

    return dispatch(fetchConfig('meet')).then(config => {
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
    const { initialized } = this.state;
    const { config, user, ...other } = this.props;
    const ready = config && user && initialized ? true : false;

    const soundSrc = [ soundSprite1Ogg, soundSprite1Mp3 ];
    const soundSprite = soundSprite1Json;

    return (
      <BaseContainer ready={ready} {...other}>
        <HowlingProvider src={soundSrc} sprite={soundSprite}>
          <Router basename="/meet">
            <Switch>
              {routes.map((route, i) => <Route key={i} {...route} />)}
              <Redirect to="/r" />
            </Switch>
          </Router>
        </HowlingProvider>
      </BaseContainer>
    );
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired,

  offline: PropTypes.bool.isRequired,
  updateAvailable: PropTypes.bool.isRequired,
  config: PropTypes.object,
  user: PropTypes.object,
  error: PropTypes.object,

  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => {
  const { offline, updateAvailable, config, user, error } = state.common;

  return {
    offline,
    updateAvailable,
    config,
    user,
    error,
  };
};

export default connect(mapStateToProps)(withStyles(styles)(App));
