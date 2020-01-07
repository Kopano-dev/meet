import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { withStyles } from '@material-ui/core/styles';
import MicIcon from '@material-ui/icons/Mic';
import MicOffIcon from '@material-ui/icons/MicOff';

import { doMuteOrUnmute } from '../actions/meet';

import FabWithProgress from './FabWithProgress';

export const styles = () => {
  return {
    root: {
    },
  };
};

class FloatingMicMuteButton extends React.PureComponent {
  handleClick = () => {
    const { muteMic, doMuteOrUnmute } = this.props;

    doMuteOrUnmute({muteMic: !muteMic});
  }

  render() {
    const { gUMSupported, muteMic, umAudioPending, ...other } = this.props;
    delete other.doMuteOrUnmute;

    if (!gUMSupported) {
      return null;
    }

    return (
      <FabWithProgress
        color="inherit"
        onClick={this.handleClick}
        pending={umAudioPending}
        {...other}
      >
        {muteMic ? <MicOffIcon /> : <MicIcon />}
      </FabWithProgress>
    );
  }
}

FloatingMicMuteButton.propTypes = {
  classes: PropTypes.object.isRequired,

  muteMic: PropTypes.bool.isRequired,

  gUMSupported: PropTypes.bool.isRequired,
  umAudioPending: PropTypes.bool.isRequired,

  doMuteOrUnmute: PropTypes.func.isRequired,
};

const mapStateToProps = state => {
  const { muteMic } = state.meet;
  const { gUMSupported, umAudioPending } = state.media;

  return {
    muteMic,
    gUMSupported,
    umAudioPending,
  };
};

const mapDispatchToProps = dispatch => bindActionCreators({
  doMuteOrUnmute,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(FloatingMicMuteButton));
