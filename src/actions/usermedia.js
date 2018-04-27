import 'webrtc-adapter';

import * as types from './types';

export const globalSettings = (() => {
  const s = {
    // NOTE(longsleep): muteWithAddRemoveTracks enables removing/adding of
    // tracks in established RTC connections. It works in Chrome :) - rest is
    // so far untested.
    muteWithAddRemoveTracks: true,
  };

  return s;
})();

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

const enumerateDevices = async () => {
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
};

export function requestUserMedia(id='', video=true, audio=true) {
  let status = requestUserMediaStatus[id];
  if (!status) {
    status = requestUserMediaStatus[id] = {
      id: id,
      idx: 0,
    };
  }

  const idx = ++status.idx;
  console.info('requestUserMedia request', idx, status, {video, audio}); // eslint-disable-line no-console

  return async dispatch => {
    // Generate constraints for requested devices filtered by existing devices.
    return enumerateDevices().then(({ videoSource, audioSource }) => {
      console.info('requestUserMedia devices', idx, status, // eslint-disable-line no-console
        {video: videoSource && true, audio: audioSource && true});
      if (idx !== status.idx) {
        console.warn('requestUserMedia is outdated after enumerateDevices', // eslint-disable-line no-console
          idx, status);
        return {
          stream: null,
        };
      }

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
      if (video && videoSource) {
        constraints.video = videoConstraints;
      } else
        constraints.video = false;
      if (audio && audioSource) {
        constraints.audio = audioConstraints;
      } else {
        constraints.audio = false;
      }

      console.log('gUM constraints', constraints); // eslint-disable-line no-console
      return constraints;
    }).then(constraints => {
      // Request user media for the provided constraints.
      if (constraints === null) {
        // No constraints, do not request gUM, directly pretend to have no stream.
        console.warn('requestUserMedia no constraints', // eslint-disable-line no-console
          idx, status);
        return {
          stream: null,
        };
      }
      return navigator.mediaDevices.getUserMedia(constraints);
    }).then(stream => {
      // Process stream.
      console.log('gUM stream', idx, stream); // eslint-disable-line no-console
      if (idx !== status.idx) {
        console.warn('requestUserMedia is outdated after gUM', // eslint-disable-line no-console
          idx, status);
        stopUserMediaStream(stream);
        return {
          stream: null,
        };
      }

      // Result set.
      const info = {
        stream,
      };
      if (status.stream) {
        // Keep stream, just replace tracks.
        // NOTE(longsleep): Is this a good idea? Check support for this.
        info.stream = status.stream;
        info.removedTracks = [];
        info.newTracks = [];
        const oldTracks = status.stream.getTracks();
        const newTracks = stream.getTracks();
        for (const track of oldTracks) {
          // Stop old track.
          track.stop();
          // Remove old track from existing stream.
          status.stream.removeTrack(track);
          // Remember.
          info.removedTracks.push(track);
        }
        for (const track of newTracks) {
          // Add new track to existing stream.
          status.stream.addTrack(track);
          // Remove new track from new stream.
          stream.removeTrack(track);
          // Remember.
          info.newTracks.push(track);
        }
      }
      status.stream = info.stream;
      dispatch(userMediaAudioVideoStream(id, info.stream));
      return info;
    }).catch(err => {
      dispatch(userMediaAudioVideoStream(id, null));
      throw err;
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

export function muteStreamByType(stream, mute=true, type='video') {
  return async dispatch => {
    const helpers = {
      audio: false,
      video: false,
    };
    switch (type) {
      case 'video':
        helpers.getTracks = s => s.getVideoTracks();
        break;
      case 'audio':
        helpers.getTracks = s => s.getAudioTracks();
        break;
      default:
        throw new Error(`unsupported type: ${type}`);
    }
    helpers.id = `_mute_${type}_stream`;
    helpers[type] = true;

    const info = {
      stream,
      removedTracks: [],
      newTracks: [],
    };
    const tracks = helpers.getTracks(stream);
    if (mute && tracks.length === 0) {
      return info;
    }

    if (mute) {
      for (const track of tracks) {
        track.enabled = false;
        if (globalSettings.muteWithAddRemoveTracks) {
          track.stop();
          stream.removeTrack(track);
          info.removedTracks.push(track);
        }
      }
      return info;
    } else {
      return Promise.resolve().then(() => {
        if (globalSettings.muteWithAddRemoveTracks) {
          return dispatch(requestUserMedia(helpers.id, helpers.video, helpers.audio)).then(newInfo => {
            if (newInfo && newInfo.stream) {
              const newTracks = helpers.getTracks(newInfo.stream);
              for (const track of newTracks) {
                stream.addTrack(track);
                newInfo.stream.removeTrack(track);
                info.newTracks.push(track);
              }
              return newTracks;
            }
            return [];
          });
        } else {
          return tracks;
        }
      }).then(tracks => {
        for (const track of tracks) {
          track.enabled = true;
        }
        return info;
      });
    }
  };
}

export function muteVideoStream(stream, mute=true) {
  return async dispatch => {
    return dispatch(muteStreamByType(stream, mute, 'video'));
  };
}

export function muteAudioStream(stream, mute=true) {
  return async dispatch => {
    return dispatch(muteStreamByType(stream, mute, 'audio'));
  };
}
