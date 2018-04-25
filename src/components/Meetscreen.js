import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { withStyles } from 'material-ui/styles';

import { Route, Redirect, Switch } from 'react-router';

import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

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
  syncedOnce = false;

  state = {
    loading: false,
  };

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.root}>
        <div className={classes.appFrame}>
          <main
            className={classes.content}
          >
            <Switch>
              <Route exact path="/r/call" component={CallView}/>
              <Redirect to="/r/call"/>
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
};


const mapDispatchToProps = (dispatch) => {
  return {
    dispatch,
  };
};

export default connect(null, mapDispatchToProps)(
  withStyles(styles, {withTheme: true})(
    DragDropContext(HTML5Backend)(
      Meetscreen
    )
  )
);
