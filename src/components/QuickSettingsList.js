import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { withStyles } from '@material-ui/core/styles';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ToggleSwitch from '@material-ui/core/Switch';
import ZoomOutMapIcon from '@material-ui/icons/ZoomOutMap';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import CamOffIcon from '@material-ui/icons/VideocamOff';

import { injectIntl, defineMessages, intlShape } from 'react-intl';

import { setMode, setCover } from '../actions/meet';

const styles = () => ({
  root: {},
});

const translations = defineMessages({
  settingsAudioOnlyLabel: {
    id: 'callView.settingsAudioOnly.label',
    defaultMessage: 'Audio only',
  },
  settingsVideoCoverLabel: {
    id: 'callView.settingsVideoCoverLabel.label',
    defaultMessage: 'Autofit',
  },
});

class QuickSettingsList extends React.PureComponent {
  handleVoiceOnlyToggle = () => {
    const { mode, setMode } = this.props;
    setMode(mode === 'call' ? 'videocall' : 'call');
  }

  handleAutofitToggle = () => {
    const { cover, setCover } = this.props;

    setCover(!cover);
  }

  render() {
    const { classes, intl, mode, cover, withIcons, ...other } = this.props;
    delete other.setMode;
    delete other.setCover;

    return <List className={classes.root} {...other}>
      <ListItem>
        {withIcons && <ListItemIcon>
          <CamOffIcon />
        </ListItemIcon>}
        <ListItemText primary={intl.formatMessage(translations.settingsAudioOnlyLabel)} />
        <ListItemSecondaryAction>
          <ToggleSwitch
            color="primary"
            onChange={this.handleVoiceOnlyToggle}
            checked={mode === 'call'}
          />
        </ListItemSecondaryAction>
      </ListItem>
      <ListItem>
        {withIcons && <ListItemIcon>
          <ZoomOutMapIcon />
        </ListItemIcon>}
        <ListItemText primary={intl.formatMessage(translations.settingsVideoCoverLabel)} />
        <ListItemSecondaryAction>
          <ToggleSwitch
            color="primary"
            onChange={this.handleAutofitToggle}
            checked={cover}
          />
        </ListItemSecondaryAction>
      </ListItem>
    </List>;
  }
}

QuickSettingsList.propTypes = {
  classes: PropTypes.object.isRequired,
  intl: intlShape.isRequired,

  withIcons: PropTypes.bool,

  mode: PropTypes.string.isRequired,
  cover: PropTypes.bool.isRequired,

  setMode: PropTypes.func.isRequired,
  setCover: PropTypes.func.isRequired,
};

const mapStateToProps = state => {
  const { mode, cover } = state.meet;

  return {
    mode,
    cover,
  };
};

const mapDispatchToProps = dispatch => bindActionCreators({
  setMode,
  setCover,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(injectIntl(QuickSettingsList)));
