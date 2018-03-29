import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { withStyles } from 'material-ui/styles';
import Typography from 'material-ui/Typography';


const styles = theme => ({
  root: {
    overflowY: 'auto',
    height: '100%',
    borderTop: `1px solid ${theme.palette.text.divider}`,
  },
  message: {
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit * 3,
    paddingRight: theme.spacing.unit * 3,
  },
});

class ErrorView extends React.PureComponent {
  render() {
    const { classes, error } = this.props;

    return (
      <div className={classes.root}>
        <div className={classes.message}>
          <Typography type="headline" gutterBottom>{error.message}</Typography>
          <Typography>{error.detail}</Typography>
        </div>
      </div>
    );
  }
}

ErrorView.propTypes = {
  classes: PropTypes.object.isRequired,

  error: PropTypes.object.isRequired,
};

const mapStateToProps = state => {
  return {
    error: state.common.error,
  };
};

export default connect(mapStateToProps)(withStyles(styles)(ErrorView));
