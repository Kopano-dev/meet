import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import SettingsIcon from '@material-ui/icons/Settings';

import { injectIntl, intlShape, defineMessages } from 'react-intl';

import { ManagedDialogContext } from './ManagedDialogProvider';

export const styles = () => {
  return {
    root: {},
  };
};

const translations = defineMessages({
  settingsListLabel: {
    id: 'callView.settingsList.label',
    defaultMessage: 'Settings',
  },
});

class SettingsList extends React.PureComponent {
  handleClick = (target) => {
    const { onClick } = this.props;

    switch (target) {
      case 'settings':
        this.context.open('settings');
        break;
      default:
    }

    if (onClick) {
      onClick(target);
    }
  }

  render() {
    const {
      classes,
      className: classNameProp,
      intl,
      children,
      withIcons,
      ...other
    } = this.props;
    delete other.onClick;

    return <List className={classNames(classes.root, classNameProp)} {...other}>
      <ListItem button onClick={() => {
        this.handleClick('settings');
      }}>
        {withIcons && <ListItemIcon>
          <SettingsIcon />
        </ListItemIcon>}
        <ListItemText primary={intl.formatMessage(translations.settingsListLabel)}/>
      </ListItem>
      {children}
    </List>;
  }
}

SettingsList.contextType = ManagedDialogContext;

SettingsList.propTypes = {
  classes: PropTypes.object.isRequired,
  intl: intlShape.isRequired,

  children: PropTypes.node,

  className: PropTypes.string,

  withIcons: PropTypes.bool,

  onClick: PropTypes.func,
};

export default withStyles(styles)(injectIntl(SettingsList));
