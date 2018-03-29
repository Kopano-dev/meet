import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { withStyles } from 'material-ui/styles';

import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';


const styles = theme => {
  console.debug('theme', theme); // eslint-disable-line no-console

  return {
    root: {
      height: '100vh',
      minWidth: 400,
    },
    appFrame: {
      position: 'relative',
      display: 'flex',
      width: '100%',
      height: '100%',
    },
    appBar: {
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      boxSizing: 'border-box',
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    logo: {
      height: 24,
      verticalAlign: 'middle',
      paddingRight: 10,
    },
    flex: {
      flex: 1,
    },
    menuButton: {
      marginLeft: 12,
      marginRight: 20,
    },
  };
};

class Calendarscreen extends React.PureComponent {
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
            <p>Meet - not meat ...</p>
          </main>
        </div>
      </div>
    );
  }
}

Calendarscreen.propTypes = {
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
      Calendarscreen
    )
  )
);
