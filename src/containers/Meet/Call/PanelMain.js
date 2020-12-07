import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { injectIntl, intlShape } from 'react-intl';

import { withStyles } from '@material-ui/core/styles';
import Hidden from '@material-ui/core/Hidden';
import Fab from '@material-ui/core/Fab';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import AddCallIcon from 'mdi-material-ui/PhonePlus';
import CallIcon from '@material-ui/icons/Call';
import ContactsIcon from '@material-ui/icons/Contacts';

import MasterButton from 'kpop/es/MasterButton/MasterButton';

import Recents from '../Recents';
import ContactSearch from '../ContactSearch';

import translations from './translations';

const styles = theme => ({
  masterButton: {
    margin: `${theme.spacing(2)}px 24px`,
  },
  tabs: {
    borderTop: '1px solid #eee',
    borderBottom: '1px solid #eee',
  },
  tab: {
    fontSize: '0.7em',
  },
  mainView: {
    flex: 1,
    minWidth: 300,
  },
  contactSearchView: {
    background: 'white',
    paddingTop: 10 + theme.spacing(1),
    [theme.breakpoints.meet.minimalHeightDown]: {
      paddingTop: 0,
    },
  },
  fab: {
    position: 'absolute',
    zIndex: theme.zIndex.drawer - 1,
    bottom: theme.spacing(4),
    right: theme.spacing(3),
  },
});

const PanelMain = ({
  classes,
  intl,
  onFabClick,
  onEntryClick,
  onActionClick,
  openDialog,
}) => {
  const [openTab, setOpenTab] = useState('recents');

  const handleTabChange = (event, value) => {
    setOpenTab(value);
  };

  return <React.Fragment>
    <Hidden smDown>
      <MasterButton icon={<AddCallIcon />} onClick={onFabClick} className={classes.masterButton}>
        {intl.formatMessage(translations.masterButtonLabel)}
      </MasterButton>
    </Hidden>
    <Tabs
      value={openTab}
      className={classes.tabs}
      indicatorColor="primary"
      textColor="primary"
      onChange={handleTabChange}
      centered
      variant="fullWidth"
    >
      <Tab value="recents" className={classes.tab} icon={<CallIcon />} label={intl.formatMessage(translations.tabLabelCalls)} />
      <Tab value="people" className={classes.tab} icon={<ContactsIcon />} label={intl.formatMessage(translations.tabLabelContacts)} />
    </Tabs>
    { openTab === 'recents' ?
      <Recents
        className={classes.mainView}
        onEntryClick={onEntryClick}
        onCallClick={onFabClick}
      /> :
      <ContactSearch
        className={classNames(classes.mainView, classes.contactSearchView)}
        onEntryClick={(...args) => {
          onEntryClick(...args);
          openDialog({newCall: false});
        }}
        onActionClick={onActionClick}
        embedded
      ></ContactSearch>
    }
    <Hidden mdUp>
      <Fab
        className={classes.fab}
        aria-label={intl.formatMessage(translations.fabButtonAriaLabel)}
        color="primary"
        onClick={onFabClick}
      >
        <AddCallIcon />
      </Fab>
    </Hidden>
  </React.Fragment>;
};

PanelMain.propTypes = {
  classes: PropTypes.object.isRequired,
  intl: intlShape.isRequired,

  onFabClick: PropTypes.func.isRequired,
  onEntryClick: PropTypes.func.isRequired,
  onActionClick: PropTypes.func.isRequired,
  openDialog: PropTypes.func.isRequired,
};

export default injectIntl(withStyles(styles)(PanelMain));
