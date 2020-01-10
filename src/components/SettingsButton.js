import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';
import SettingsIcon from '@material-ui/icons/SettingsOutlined';

import IconButtonWithPopover from './IconButtonWithPopover';
import SettingsList from './SettingsList';
import QuickSettingsList from './QuickSettingsList';

export const styles = () => {
  return {
    root: {},
    list: {
      minWidth: 230,
    },
  };
};

class SettingsButton extends React.PureComponent {
  constructor(props) {
    super(props);

    this.settingsMenuRef = React.createRef();
  }

  handleClick = () => {
    this.settingsMenuRef.current.close();
  }

  render() {
    const {
      classes,
      className: classNameProp,
      ...other
    } = this.props;

    return <IconButtonWithPopover
      className={classNames(classes.root, classNameProp)}
      innerRef={this.settingsMenuRef}
      icon={<SettingsIcon/>}
      {...other}
    >
      <SettingsList
        className={classes.list}
        onClick={this.handleClick}
      />
      <QuickSettingsList/>
    </IconButtonWithPopover>;
  }
}

SettingsButton.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default withStyles(styles)(SettingsButton);
