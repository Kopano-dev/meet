import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { injectIntl, intlShape, defineMessages, FormattedMessage } from 'react-intl';

import { enqueueSnackbar, closeSnackbar } from 'kpop/es/common/actions';

import Button from '@material-ui/core/Button';

const translations = defineMessages({
  kustomerNotZeroSnack: {
    id: 'snackStack.kustomerNotZero.snack',
    defaultMessage: 'The license keys installed on this Kopano Meet system have expired or are being overused.',
  },
});

const KWM_SERVERSTATUS_KUSTOMER_NOT_ZERO = 'kwm_serverstatus_kustomer_not_zero';
const KWM_SERVERSTATUS_KUSTOMER_NOT_ZERO_INTERVAL = 60 * 5 * 1000;

class SnackStack extends React.PureComponent {
  constructor(props) {
    super(props);

    this.timers = new Map();
    this.snacks = new Map();
  }

  componentDidMount() {
    this.updateSnacks({});
  }

  componentDidUpdate(prevProps, prevState) {
    this.updateSnacks(prevProps);
  }

  componentWillUnmount() {
    for (const r of this.timers) {
      clearTimeout(r);
    }
    this.timers.clear();
    for (const key of this.snacks) {
      this.closeSnackbarByKey(key);
    }
    this.snacks.clear();
  }

  render() {
    return null;
  }

  handleSnackbarCloseClick = (key, timer) => () => {
    this.closeSnackbarByKey(key, timer);
  }

  updateSnacks(prevProps) {
    const { kustomer } = this.props;

    if (prevProps.kustomer !== kustomer) {
      if (kustomer > 0) {
        this.enqueueSnackByKey(KWM_SERVERSTATUS_KUSTOMER_NOT_ZERO);
      } else {
        this.closeSnackbarByKey(KWM_SERVERSTATUS_KUSTOMER_NOT_ZERO);
      }
    }
  }

  enqueueSnackByKey = key => {
    const { intl, enqueueSnackbar } = this.props;

    if (this.timers.has(key)) {
      return;
    }

    switch (key) {
      case KWM_SERVERSTATUS_KUSTOMER_NOT_ZERO:
        enqueueSnackbar({
          message: intl.formatMessage(translations.kustomerNotZeroSnack),
          options: {
            key: KWM_SERVERSTATUS_KUSTOMER_NOT_ZERO,
            variant: 'error',
            persist: true,
            action: key => {
              return <Button
                size="small"
                onClick={this.handleSnackbarCloseClick(key, KWM_SERVERSTATUS_KUSTOMER_NOT_ZERO_INTERVAL)}
              >
                <FormattedMessage id="snackStack.kustomerNotZero.snackButton.text" defaultMessage="dismiss"></FormattedMessage>
              </Button>;
            },
          },
        });
        break;

      default:
        return;
    }

    this.snacks.set(key, true);
  }

  closeSnackbarByKey = (key, timer) => {
    const { closeSnackbar } = this.props;

    if (!this.snacks.get(key)) {
      return;
    }
    this.snacks.set(key, false);

    closeSnackbar(key);
    const r = this.timers.get(key);
    if (r) {
      clearTimeout(r);
      this.timers.delete(key);
    }

    if (timer) {
      // Register timer to display the snack again.
      this.timers.set(setTimeout(() => {
        this.timers.delete(key);
        this.enqueueSnackByKey(key);
      }, timer));
    }
  }

}

SnackStack.propTypes = {
  intl: intlShape.isRequired,

  enqueueSnackbar: PropTypes.func.isRequired,
  closeSnackbar: PropTypes.func.isRequired,

  kustomer: PropTypes.number.isRequired,
};

SnackStack.defaultProps = {
  kustomer: 0,
};

const mapStateToProps = state => {
  const { serverStatus } = state.kwm;

  return {
    kustomer: serverStatus.kustomer || 0,
  };
};

const mapDispatchToProps = dispatch => bindActionCreators({
  enqueueSnackbar,
  closeSnackbar,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(SnackStack));
