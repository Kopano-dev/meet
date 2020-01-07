import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { withStyles } from '@material-ui/core/styles';
import CamIcon from '@material-ui/icons/Videocam';
import CamOffIcon from '@material-ui/icons/VideocamOff';

import { doMuteOrUnmute } from '../actions/meet';

import FabWithProgress from './FabWithProgress';

export const styles = () => {
  return {
    root: {
    },
  };
};

class FloatingCamMuteButton extends React.PureComponent {
  handleClick = () => {
    const { muteCam, doMuteOrUnmute } = this.props;

    doMuteOrUnmute({muteCam: !muteCam});
  }

  render() {
    const { gUMSupported, muteCam, umVideoPending, ...other  } = this.props;

    if (!gUMSupported) {
      return null;
    }

    delete other.doMuteOrUnmute;

    return (
      <FabWithProgress
        color="inherit"
        onClick={this.handleClick}
        pending={umVideoPending}
        {...other}
      >
        {muteCam ? <CamOffIcon /> : <CamIcon />}
      </FabWithProgress>
    );
  }
}

FloatingCamMuteButton.propTypes = {
  classes: PropTypes.object.isRequired,

  muteCam: PropTypes.bool.isRequired,

  gUMSupported: PropTypes.bool.isRequired,
  umVideoPending: PropTypes.bool.isRequired,

  doMuteOrUnmute: PropTypes.func.isRequired,
};

const mapStateToProps = state => {
  const { muteCam } = state.meet;
  const { gUMSupported, umVideoPending } = state.media;

  return {
    muteCam,
    gUMSupported,
    umVideoPending,
  };
};

const mapDispatchToProps = dispatch => bindActionCreators({
  doMuteOrUnmute,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(FloatingCamMuteButton));
