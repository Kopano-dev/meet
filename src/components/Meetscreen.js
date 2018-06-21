import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { withStyles } from 'material-ui/styles';

import { Route, Redirect, Switch } from 'react-router';

import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import { receiveOIDCState } from 'kpop/es/oidc/actions';

import CallView from './CallView';

const styles = theme => {
  console.debug('theme', theme); // eslint-disable-line no-console

  return {
    root: {
      height: '100vh',
      overflow: 'hidden',
    },
    appFrame: {
      position: 'relative',
      display: 'flex',
      width: '100%',
      height: '100%',
    },
  };
};

class Meetscreen extends React.PureComponent {
  componentDidUpdate(prevProps) {
    const { dispatch, location, oidcState } = this.props;

    if (location !== prevProps.location) {
      // Remember location in OIDC state.
      if (oidcState.pathname !== location.pathname) {
        dispatch(receiveOIDCState({
          pathname: location.pathname,
        }));
      }
    }
  }

  render() {
    const { classes, oidcState } = this.props;

    // TODO(longsleep): Find a better way to figure out if we got a
    // sub route via oidc.
    const start = oidcState.pathname.length > 3 ? oidcState.pathname : '/r/call';

    return (
      <div className={classes.root}>
        <div className={classes.appFrame}>
          <main
            className={classes.content}
          >
            <Switch>
              <Route path="/r/(call|conference|group)" component={CallView}/>
              <Redirect to={start}/>
            </Switch>
          </main>
        </div>
      </div>
    );
  }
}

Meetscreen.propTypes = {
  dispatch: PropTypes.func.isRequired,

  classes: PropTypes.object.isRequired,

  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,

  oidcState: PropTypes.object,
};

const mapStateToProps = state => {
  const { state: oidcState } = state.oidc;

  return {
    oidcState,
  };
};

export default connect(mapStateToProps)(
  withStyles(styles, {withTheme: true})(
    DragDropContext(HTML5Backend)(
      Meetscreen
    )
  )
);
