import React from 'react';
import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import DevicesIcon from '@material-ui/icons/Devices';

import { injectIntl, FormattedMessage, intlShape } from 'react-intl';

import { withManagedDialog } from './ManagedDialogProvider';
import DeviceSettings from './DeviceSettings';

const styles = theme => {
  return {
    root: {
    },
    paper: {
      maxHeight: 450,
      height: '80vh',
      width: '80vw',
      [theme.breakpoints.up('md')]: {
        height: '60%',
        maxHeight: 600,
        minHeight: 340,
        minWidth: 480,
      },
    },
    tabs: {
      marginBottom: theme.spacing.unit * 2,
    },
    tabIcon: {
      verticalAlign: 'bottom',
      marginRight: theme.spacing.unit / 2,
    },
    formControl: {
      margin: theme.spacing.unit,
      width: '50vw',
      minWidth: 200,
      maxWidth: 320,
      verticalAlign: 'baseline',
      marginRight: theme.spacing.unit * 2,
    },
    suffix: {
      verticalAlign: 'baseline',
      display: 'inline-block',

      '& > *': {
        verticalAlign: 'bottom',
      },
    },
    videoPreview: {
      width: 100,
      display: 'inline-block',
      verticalAlign: 'bottom',
    },
  };
};

class SettingsDialog extends React.PureComponent {
  state = {
    openTab: 'devices',
  }
  active = true;

  constructor(props) {
    super(props);

    this.devicesRef = React.createRef();
  }

  handleDoneClick = async () => {
    const { onClose } = this.props;

    await this.devicesRef.current.save();
    onClose();
  }

  render() {
    const { classes, open, onClose, ...other } = this.props;
    const { openTab } = this.state;

    return (
      <Dialog
        className={classes.root}
        open={open}
        onClose={onClose}
        PaperProps={{
          className: classes.paper,
        }}
        {...other}
      >
        <Tabs
          indicatorColor="secondary"
          textColor="secondary"
          centered
          value={openTab}
          className={classes.tabs}
        >
          <Tab label={
            <React.Fragment>
              <DevicesIcon className={classes.tabIcon}/> <FormattedMessage
                id="settingsDialog.devicesTab.label" defaultMessage="Devices"></FormattedMessage>
            </React.Fragment>
          }
          value="devices"/>
        </Tabs>
        { openTab === 'devices' ?
          <DeviceSettings component={DialogContent} innerRef={this.devicesRef} />
          : null
        }
        <DialogActions className={classes.actions}>
          <Button color="secondary" variant="text" onClick={this.handleDoneClick}>
            <FormattedMessage id="settingDialog.doneButton.label" defaultMessage="Done"></FormattedMessage>
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

SettingsDialog.propTypes = {
  classes: PropTypes.object.isRequired,
  intl: intlShape.isRequired,

  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};

export default withStyles(styles)(injectIntl(withManagedDialog('settings')(SettingsDialog)));
