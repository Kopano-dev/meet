import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';
import DialogContent from '@material-ui/core/DialogContent';
import CircularProgress from '@material-ui/core/CircularProgress';

const styles = () => {
  return {
    root: {
      flex: 1,
      display: 'flex',
    },
    container: {
      flex: 1,
      display: 'flex',
    },
    spinner: {
      margin: 'auto',
    },
  };
};

class Loading extends React.PureComponent {
  render() {
    const { classes, className: classNameProp } = this.props;

    return <DialogContent className={classNames(classNameProp, classes.root)}>
      <div className={classes.container}>
        <CircularProgress className={classes.spinner}/>
      </div>
    </DialogContent>;
  }
}

Loading.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default withStyles(styles)(Loading);
