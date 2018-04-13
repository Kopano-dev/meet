import 'webrtc-adapter';

import * as types from './types';

const requestUserMediaStatus = {};

const getSupportedConstraints = () => {
  try {
    const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
    console.debug('supportedConstraints', supportedConstraints); // eslint-disable-line no-console
    return supportedConstraints;
  } catch(err) {
    console.debug('supportedConstraints failed with error', err); // eslint-disable-line no-console
    return {};
  }
};
export const supportedConstraints = getSupportedConstraints();

/*const enumerateDevices = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();

  let videoSource = null;
  let audioSource = null;
  devices.forEach(device => {
    if (device.kind === 'videoinput' && videoSource === null) {
      videoSource = device.deviceId;
    } else if (device.kind === 'audioinput' && audioSource === null) {
      audioSource = device.deviceId;
    }
  });

  return {
    videoSource,
    audioSource,
  };
};*/

export function requestUserMedia(id='', video=true, audio=true) {
  let status = requestUserMediaStatus[id];
  if (!status) {
    status = requestUserMediaStatus[id] = {
      id: id,
      idx: 0,
    };
  }

  const idx = ++status.idx;
  console.info('requestUserMedia', idx, status, video, audio); // eslint-disable-line no-console

  return async dispatch => {
    // Generate constraints syntax according to the standard.
    // https://w3c.github.io/mediacapture-main/#constrainable-interface
    const constraints = {};
    const videoConstraints = {
      advanced: [],
    };
    const audioConstraints = {
      advanced: [],
    };
    if (video) {
      if (supportedConstraints.width && supportedConstraints.height) {
        videoConstraints.width = {
          ideal: 640,
        };
        videoConstraints.height = {
          ideal: 360,
        };
      }
      if (supportedConstraints.frameRate) {
        videoConstraints.frameRate = {
          min: 10,
          ideal: 15,
        };
      }
      if (supportedConstraints.facingMode) {
        videoConstraints.advanced.push({facingMode: 'user'});
      }
    }

    // Apply.
    if (video) {
      constraints.video = videoConstraints;
    } else
      constraints.video = false;
    if (audio) {
      constraints.audio = audioConstraints;
    } else {
      constraints.audio = false;
    }

    console.log('gUM constraints', constraints); // eslint-disable-line no-console

    return navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        console.log('gUM stream', idx, stream); // eslint-disable-line no-console
        if (idx !== status.idx) {
          stopUserMediaStream(stream);
          return null;
        }

        if (status.stream) {
          // Stop previous stream.
          stopUserMediaStream(status.stream);
        }
        status.stream = stream;
        dispatch(userMediaAudioVideoStream(id, stream));
        return stream;
      });
  };
}

function userMediaAudioVideoStream(id='', stream) {
  return {
    type: types.USERMEDIA_AUDIOVIDEO_STREAM,
    id,
    stream,
  };
}

export function stopUserMedia(id='') {
  return async dispatch => {
    let status = requestUserMediaStatus[id];
    if (status) {
      status.idx++;
      if (status.stream) {
        stopUserMediaStream(status.stream);
        status.stream = null;
      }
      dispatch(userMediaAudioVideoStream(id, null));
    }
  };
}

function stopUserMediaStream(stream) {
  if (stream.stop) {
    // NOTE(longsleep): Backwards compatibilty. Is this still required?
    stream.stop();
  } else {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }
}

export function muteVideoStream(stream, mute=true) {
  return () => {
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) {
      return;
    }

    for (var i = 0; i < videoTracks.length; ++i) {
      videoTracks[i].enabled = !mute;
    }
  };
}

export function muteAudioStream(stream, mute=true) {
  return () => {
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      return;
    }

    for (let i = 0; i < audioTracks.length; ++i) {
      audioTracks[i].enabled = !mute;
    }
  };
}
