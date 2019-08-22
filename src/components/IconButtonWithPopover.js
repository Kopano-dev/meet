import React from 'react';
import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import Popover from '@material-ui/core/Popover';
import uniqueId from 'lodash-es/uniqueId';


export const styles = () => {
  return {
    root: {
    },
  };
};

class UserProfileButton extends React.PureComponent {
  state = {
    anchorEl: null,
  };

  constructor(props) {
    super(props);
    this.id = uniqueId('iconbntpopover-');
  }

  handleClick = handler => event => {
    this.setState({ anchorEl: event.currentTarget });
    if (handler) {
      handler(event);
    }
  }

  handleClose = () => {
    this.close();
  }

  close = () => {
    const { onClose } = this.props;
    this.setState({ anchorEl: null });
    if (onClose) {
      onClose();
    }
  }

  render() {
    const { anchorEl } = this.state;
    const { children, theme, onClick, icon, ...other  } = this.props;

    return (
      <React.Fragment>
        <IconButton
          aria-owns={anchorEl ? this.id : null}
          aria-haspopup="true"
          onClick={this.handleClick(onClick)}
          {...other}
        >
          {icon}
        </IconButton>
        <Popover
          id={this.id}
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={this.handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: theme.direction === 'ltr' ? 'right' : 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: theme.direction === 'ltr' ? 'right' : 'left',
          }}
        >
          {children}
        </Popover>
      </React.Fragment>
    );
  }
}

UserProfileButton.propTypes = {
  /**
   * The content of the popup.
   */
  children: PropTypes.node,
  /**
   * Useful to extend the style applied to components.
   */
  classes: PropTypes.object.isRequired,
  /**
   * @ignore
   */
  theme: PropTypes.object.isRequired,
  /**
   * The icon to use.
   */
  icon: PropTypes.node.isRequired,
  /**
   * Click handler to execute when button is clicked.
   */
  onClick: PropTypes.func,
  /**
   * Click handler to execute when popover menu is closed.
   */
  onClose: PropTypes.func,
};

export default withStyles(styles, { name: 'KpopUserProfileButton', withTheme: true })(UserProfileButton);
