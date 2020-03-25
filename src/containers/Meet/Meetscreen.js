import React from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { withStyles } from '@material-ui/core/styles';
import { defineMessages } from 'react-intl';

import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import adapter from 'webrtc-adapter';

import { setError } from 'kpop/es/common/actions';

import CallView from './CallView';


const styles = theme => {
  console.debug('theme', theme); // eslint-disable-line no-console

  return {
    root: {
      position: 'relative',
      display: 'flex',
      flex: 1,
    },
    content: {
      flex: 1,
      display: 'flex',
    },
  };
};

const translations = defineMessages({
  browserUnknownUnsupported: {
    id: 'meetscreen.errorMessage.browserUnknownUnsupported.message',
    defaultMessage: 'Your browser is unknown and thus not supported.',
  },
  browserUnsupported: {
    id: 'meetscreen.errorMessage.browserUnsupported.message',
    defaultMessage: 'Your browser is not supported - expect issues.',
  },
  browserTooOld: {
    id: 'meetscreen.errorMessage.browserTooOld.message',
    defaultMessage: 'Your browser is too old and thus not supported.',
  },
});

class Meetscreen extends React.PureComponent {
  componentDidMount() {
    Promise.resolve().then(this.checkWebRTCSupport);
  }

  checkWebRTCSupport = () => {
    const { setError } = this.props;

    const minimal = {
      // For interoperability with Firefox and others, Meet uses unified SDP plan. This is not supported by Chrome
      // before M69. See https://webrtc.org/web-apis/chrome/unified-plan/.
      'chrome': {
        min: 69,
      },
      // Edge (non Chromium) is not supported at all.
      'edge': {
        checkUnsupported: () => true,
      },
      // Firefox supported with some decent version which implements standard WebRTC.
      'firefox': {
        min: 59,
      },
      // AppleWebKit 604 is the first one with usable WebRTC (Safari 11).
      'safari': {
        min: 604,
        checkTooOld: (browserDetails) => {
          return browserDetails.supportsUnifiedPlan !== undefined ? !browserDetails.supportsUnifiedPlan : false;
        },
        checkUnsupported: () => {
          // NOTE(longsleep): Check if running in standalone mode. For iOS < 13.4
          // it is not possible to access user media when running in standalone
          // mode. See https://bugs.webkit.org/show_bug.cgi?id=185448 for further
          // info. For now we do assume the user has updated to latest and thus
          // we show no warning.
        },
      },
    };

    const { browserDetails } = adapter;

    if (browserDetails.version === undefined) {
      setError({
        message: translations.browserUnknownUnsupported,
        withoutFatalSuffix: true,
        fatal: false,
      });
      return;
    }

    for (const [name, options] of Object.entries(minimal)) {
      if (browserDetails.browser === name) {
        let checkUnsupported = options.checkUnsupported ? options.checkUnsupported(browserDetails) : false;
        if (checkUnsupported) {
          setError({
            message: translations.browserUnknownUnsupported,
            withoutFatalSuffix: true,
            fatal: false,
          });
          break;
        }
        let versionTooOld = options.min && browserDetails.version < options.min;
        let checkTooOld = options.checkTooOld ? options.checkTooOld(browserDetails) : false;
        if (versionTooOld || checkTooOld) {
          setError({
            message: translations.browserTooOld,
            withoutFatalSuffix: true,
            fatal: false,
          });
          break;
        }
        break;
      }
    }
  }

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.root}>
        <main
          className={classes.content}
        >
          <CallView/>
        </main>
      </div>
    );
  }
}

Meetscreen.propTypes = {
  classes: PropTypes.object.isRequired,
  setError: PropTypes.func.isRequired,
};

const mapDispatchToProps = dispatch => bindActionCreators({
  setError,
}, dispatch);

const mapStateToProps = state => {
  const { config } = state.common;

  return {
    config,
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(
  withStyles(styles, {withTheme: true})(
    DragDropContext(HTML5Backend)(
      Meetscreen
    )
  )
);
