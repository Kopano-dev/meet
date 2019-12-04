import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { withStyles } from '@material-ui/core/styles';

import { Route, Redirect, Switch } from 'react-router';

import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import CallView from './CallView';
import Notifier from './Notifier';

const styles = theme => {
  console.debug('theme', theme); // eslint-disable-line no-console

  return {
    root: {
      position: 'relative',
      display: 'flex',
      flex: 1,
    },
    content: {
      flex: 1,
      display: 'flex',
    },
  };
};

class Meetscreen extends React.PureComponent {
  render() {
    const { classes } = this.props;

    return (
      <div className={classes.root}>
        <main
          className={classes.content}
        >
          <Notifier/>
          <Switch>
            <Route path="/r/(call|conference|group)" component={CallView}/>
            <Redirect to="/r/call"/>
          </Switch>
        </main>
      </div>
    );
  }
}

Meetscreen.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default connect()(
  withStyles(styles, {withTheme: true})(
    DragDropContext(HTML5Backend)(
      Meetscreen
    )
  )
);
