import React from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { withStyles } from '@material-ui/core/styles';

import { Route, Redirect, Switch } from 'react-router';

import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import adapter from 'webrtc-adapter';

import { setError } from 'kpop/es/common/actions';
import { isMobile, isInStandaloneMode } from 'kpop/es/utils';

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
          // TODO(longsleep): Check if running in standalone mode since it still is
          // not possible to access getUserMedia when running in standalone mode on iOS. See
          // https://bugs.webkit.org/show_bug.cgi?id=185448 for further info.
          if (isMobile() && isInStandaloneMode()) {
            setError({
              message: 'Apple devices do not support camera/mic access when started as App',
              withoutFatalSuffix: true,
              fatal: false,
            });
          }
        },
      },
    };

    const { browserDetails } = adapter;

    if (browserDetails.version === undefined) {
      setError({
        message: 'Your browser is unknown and thus not supported',
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
            message: 'Your browser is not supported - expect issues',
            withoutFatalSuffix: true,
            fatal: false,
          });
          break;
        }
        let versionTooOld = options.min && browserDetails.version < options.min;
        let checkTooOld = options.checkTooOld ? options.checkTooOld(browserDetails) : false;
        if (versionTooOld || checkTooOld) {
          setError({
            message: 'Your browser too old and not fully supported',
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
          <Switch>
            <Route path="/r/(call|conference|group)" component={CallView}/>
            <Redirect to="/r/call"/>
          </Switch>
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

export default connect(null, mapDispatchToProps)(
  withStyles(styles, {withTheme: true})(
    DragDropContext(HTML5Backend)(
      Meetscreen
    )
  )
);
