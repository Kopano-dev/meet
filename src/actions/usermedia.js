import * as adapter from 'webrtc-adapter';

import * as types from './types';

export const globalSettings = (() => {
  const s = {
    // NOTE(longsleep): muteWithAddRemoveTracks enables removing/adding of
    // tracks in established RTC connections.
    // - Works:
    //   - Chrome 67
    // - Issues:
    //   - Firefox 60 (added streams do not play on remote side)
    muteWithAddRemoveTracks: adapter.browserDetails.browser === 'chrome',
  };

  console.info('gUM global settings', s, adapter.browserDetails); // eslint-disable-line no-console
  return s;
})();

const requestUserMediaStatus = {};

const getSupportedConstraints = () => {
  const supportedConstraints = {};
  try {
    Object.assign(supportedConstraints, navigator.mediaDevices.getSupportedConstraints());
  } catch(err) {
    console.debug('supportedConstraints failed with error', err); // eslint-disable-line no-console
  }

  // NOTE(longsleep): iOS Safari does not like all video resolutions. For now
  // we just disable thse corresponding constraints.
  if (adapter.browserDetails.browser === 'safari') {
    Object.assign(supportedConstraints, {
      height: false,
      width: false,
    });
  }

  console.debug('using supportedConstraints', supportedConstraints); // eslint-disable-line no-console
  return supportedConstraints;
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

      console.debug('gUM constraints', constraints); // eslint-disable-line no-console
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
      if (!constraints.audio && !constraints.video) {
        // Neither audio nor video -> return what we have.
        console.debug('requestUserMedia, neither audio nor video', idx, status); // eslint-disable-line no-console
        return status.stream && status.stream.active ? status.stream : null;
      }
      return navigator.mediaDevices.getUserMedia(constraints);
    }).then(stream => {
      // Process stream.
      console.debug('gUM stream', idx, stream); // eslint-disable-line no-console
      if (idx !== status.idx) {
        console.warn('requestUserMedia is outdated after gUM', // eslint-disable-line no-console
          idx, status);
        stopUserMediaStream(stream);
        return {
          stream: null,
        };
      }

      if (stream === null) {
        // Make sure to always return a stream so that users of this method do
        // not have to add handling for stream or no stream. This empty stream
        // will not be active and has no tracks.
        stream = new MediaStream();
        console.debug('requestUserMedia creating empty stream', stream); // eslint-disable-line no-console
      }

      // Result set.
      const info = {
        stream,
      };
      if (status.stream && status.stream.active && status.stream !== stream) {
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

export function muteStreamByType(stream, mute=true, type='video', id='') {
  let status = requestUserMediaStatus[id];

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
      newStream: null,
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
          return dispatch(requestUserMedia(helpers.id, helpers.video, helpers.audio)).then(async newInfo => {
            if (newInfo && newInfo.stream && newInfo.stream !== stream) {
              const newTracks = helpers.getTracks(newInfo.stream);
              if (stream.active) {
                // Make sure that stream we are adding to is still active.
                for (const track of newTracks) {
                  stream.addTrack(track);
                  newInfo.stream.removeTrack(track);
                  info.newTracks.push(track);
                }
              } else {
                // Old stream is not active, use new stream.
                info.newStream = newInfo.stream;
                if (status && status.stream) {
                  // Replace stream.
                  status.stream = info.newStream;
                }
                await dispatch(userMediaAudioVideoStream(id, info.newStream));
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

export function muteVideoStream(stream, mute=true, id='') {
  return async dispatch => {
    return dispatch(muteStreamByType(stream, mute, 'video', id));
  };
}

export function muteAudioStream(stream, mute=true, id='') {
  return async dispatch => {
    return dispatch(muteStreamByType(stream, mute, 'audio', id));
  };
}
