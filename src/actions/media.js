import adapter from 'webrtc-adapter';

import * as types from './types';

const highDefinitionVideo = false;
const stereoAudio = false;

const defaultAudioSettings = {
  echoCancellation: true,
  autoGainControl: true,
  noiseSuppression: true,
  channelCount: stereoAudio ? 2 : 1,
};

// Useful framerates are 15 and 8.
// Useful resolutions are 640x480, 640x360, 320x240, 320x160.
const defaultVideoSettings = {
  idealFrameRate: 15,
  maxFrameRate: 15,
  idealWidth: highDefinitionVideo ? 1280 : 640,
  idealHeight: highDefinitionVideo ? 720: 360,
  facingMode: 'user',
};

const defaultScreenSettings = {
  idealFrameRate: 3,
  logicalSurface: false,
};

const isMediaElementSetSinkIdSupported = (() => {
  const audio = document.createElement('audio');
  // Check support for https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId.
  return 'setSinkId' in audio;
})();

export const globalSettings = (() => {
  const s = {
    // NOTE(longsleep): muteWithAddRemoveTracks enables removing/adding of
    // tracks in established RTC connections.
    // - Works:
    //   - Chrome 67 (Plan B)
    //   - Chrome with Unified Plan.
    //   - Safari iOS 12.4
    // - Issues:
    //   - Firefox 60 (added streams do not play on remote side < Chrome 62)
    //   - Firefox 65 (disable both local streams, streams do not start again)
    //   - Chrome 72 beta (added streams do not play on remote side < Chrome 62)
    //     when Chrome 72 is using the unified plan (Plan B works).
    muteWithAddRemoveTracks: ['chrome', 'firefox', 'safari'].indexOf(adapter.browserDetails.browser) !== -1,
    // NOTE(longsleep): keeping old streamsn and just replacing tracks does not
    // work in Firefox. Disable for now. Maybe be removed completely?
    keepOldStreamAndReplaceTracks: false,
    withAudioSetSinkId: isMediaElementSetSinkIdSupported,
  };

  console.info('media global settings', s, adapter.browserDetails); // eslint-disable-line no-console
  return s;
})();

const requestUserMediaStatus = {};
const requestDisplayMediaStatus = {};

export const enumerateDevices = async () => {
  if (navigator.mediaDevices) {
    return navigator.mediaDevices.enumerateDevices();
  }
  return [];
};

const getSupportedConstraints = () => {
  const supportedConstraints = {};
  if (navigator.mediaDevices) {
    try {
      Object.assign(supportedConstraints, navigator.mediaDevices.getSupportedConstraints());
    } catch(err) {
      console.debug('supportedConstraints failed with error', err); // eslint-disable-line no-console
    }
  }

  // NOTE(longsleep): iOS Safari does not like all video resolutions and frame
  // rates. For now we just disable thse corresponding constraints to ensure
  // the correct camera is selected and all.
  // Also disable facingMode since it has apparently stopped to function.
  if (adapter.browserDetails.browser === 'safari') {
    Object.assign(supportedConstraints, {
      height: false,
      width: false,
      frameRate: false,
      facingMode: false,
    });
  }

  console.debug('using supportedConstraints', supportedConstraints); // eslint-disable-line no-console
  return supportedConstraints;
};
export const supportedConstraints = getSupportedConstraints();

const enumerateDeviceSupport = async (settings={}) => {
  const devices = await enumerateDevices();

  let videoSource = settings.videoSourceId || null;
  let audioSource = settings.audioSourceId || null;
  for (let device of devices) {
    if (videoSource === null && device.kind === 'videoinput')  {
      if (settings.video && settings.video.deviceId && settings.video.deviceId !== device.deviceId) {
        // Ignore devices with different device id if device id is given.
        continue;
      }
      videoSource = device.deviceId;
    } else if (audioSource === null && device.kind === 'audioinput') {
      if (settings.audio && settings.audio.deviceId && settings.audio.deviceId !== device.deviceId) {
        // Ignore devices with different device id if device id is given.
        continue;
      }
      audioSource = device.deviceId;
    }

    if (videoSource && audioSource) {
      // Found all, stop here.
      break;
    }
  }

  return {
    videoSource,
    audioSource,
  };
};

export function requestDisplayMedia(id='', settings={}) {
  // NOTE(longsleep): This keeps a status record and promise for gDM to allow
  // multiple to run at the same time. The last one always wins. If a new
  // request is started while another one is already pending, they will all
  // return to the same promise which is resolved on the first success or
  // error callback.
  let status = requestDisplayMediaStatus[id];
  if (!status) {
    status = requestDisplayMediaStatus[id] = {
      id: id,
      idx: 0,
    };
  }
  let result = status.result;
  if (!result) {
    result = status.result = new Promise((resolve, reject) => {
      status.resolve = resolve;
      status.reject = reject;
    });
  }

  // NOTE(longsleep): Keep an index of gDM requests to make sure multiple can
  // run in a sane fasshion at the same time.
  const idx = ++status.idx;
  console.info('requestDisplayMedia request', idx, status, settings); // eslint-disable-line no-console

  return async dispatch => {
    await dispatch(displayMediaSetPending());
    result.then(() => {
      status.result = undefined;
      dispatch(displayMediaUnsetPending());
    });

    const videoSettings = {
      ...defaultScreenSettings,
      ...settings.video,
    };

    const constraints = {
      video: {
        frameRate: {
          ideal: videoSettings.idealFrameRate || 3,
        },
        logicalSurface: videoSettings.logicalSurface,
      },
    };

    return navigator.mediaDevices.getDisplayMedia(constraints).then(async stream => {
      // Process stream.
      console.debug('gDM stream', idx, stream); // eslint-disable-line no-console
      if (idx !== status.idx) {
        console.debug('requestDisplayMedia is outdated after gDM', // eslint-disable-line no-console
          idx, status);
        if (stream !== null) {
          stopMediaStream(stream);
        }
        // Return result promise. This is resolved on success of a gUM call.
        return result;
      }

      // Result set.
      const info = {
        stream,
      };
      if (status.stream && status.stream.active && status.stream !== stream) {
        if (globalSettings.keepOldStreamAndReplaceTracks) {
          // Keep stream, just replace tracks.
          // NOTE(longsleep): Is this a good idea? Check support for this.
          info.stream = status.stream;
          info.removedTracks = [];
          info.newTracks = [];
          const oldTracks = status.stream.getTracks();
          const newTracks = stream.getTracks();
          for (const track of oldTracks) {
            // Remember.
            info.removedTracks.push(track);
            // Stop old track.
            track.stop();
            // Remove old track from existing stream.
            removeTrackFromStream(status.stream, track);
          }
          for (const track of newTracks) {
            // Remember.
            info.newTracks.push(track);
            // Add new track to existing stream.
            addTrackToStream(status.stream, track);
            // Remove new track from new stream.
            removeTrackFromStream(stream, track);
          }
        } else {
          // Ensure to stop old stream.
          stopMediaStream(status.stream, false);
        }
      }
      // Optimize track encoding for content. See https://www.w3.org/TR/mst-content-hint/.
      for (const track of stream.getTracks()) {
        if ('contentHint' in track) {
          switch (track.kind) {
            case 'video':
              track.contentHint = 'text';
              break;
          }
        }
      }
      status.stream = info.stream;
      status.resolve(info);
      await dispatch(displayMediaAudioVideoStream(id, info.stream));
      return info;
    }).catch(async err => {
      status.resolve(null);
      await dispatch(displayMediaAudioVideoStream(id, null));
      throw err;
    });
  };
}

function displayMediaAudioVideoStream(id='', stream) {
  return {
    type: types.DISPLAYMEDIA_AUDIOVIDEO_STREAM,
    id,
    stream,
  };
}

export function stopDisplayMedia(id='') {
  return async dispatch => {
    let status = requestDisplayMediaStatus[id];
    if (status) {
      status.idx++;
      if (status.stream) {
        stopMediaStream(status.stream);
        status.stream = null;
      }
      await dispatch(displayMediaAudioVideoStream(id, null));
    }
  };
}

export function requestUserMedia(id='', video=true, audio=true, settings={}) {
  // NOTE(longsleep): This keeps a status record and promise for gUM to allow
  // multiple to run at the same time. The last one always wins. If a new
  // request is started while another one is already pending, they will all
  // return to the same promise whihc is resolved on the first success or
  // error callback.
  let status = requestUserMediaStatus[id];
  if (!status) {
    status = requestUserMediaStatus[id] = {
      id: id,
      idx: 0,
    };
  }
  let result = status.result;
  if (!result) {
    result = status.result = new Promise((resolve, reject) => {
      status.resolve = resolve;
      status.reject = reject;
    });
  }
  // NOTE(longsleep): Keep an index of gUM requests to make sure multiple can
  // run in a sane fasshion at the same time.
  const idx = ++status.idx;
  console.info('requestUserMedia request', idx, status, {video, audio}, settings); // eslint-disable-line no-console

  return async dispatch => {
    await dispatch(userMediaSetPending({audio, video}));
    result.then(() => {
      status.result = undefined;
      dispatch(userMediaUnsetPending({audio, video}));
    });

    const currentSettings = {
      ...settings,
      video: {
        ...defaultVideoSettings,
        ...settings.video,
      },
      audio: {
        ...defaultAudioSettings,
        ...settings.audio,
      },
    };

    // Generate constraints for requested devices filtered by existing devices.
    return enumerateDeviceSupport(currentSettings).then(({ videoSource, audioSource }) => {
      console.info('requestUserMedia devices', idx, status, // eslint-disable-line no-console
        {video: videoSource !== null, audio: audioSource !== null});
      if (idx !== status.idx) {
        console.debug('requestUserMedia is outdated after enumerateDevices', // eslint-disable-line no-console
          idx, status);
        return null;
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
          // Try to select some decent resolution.
          videoConstraints.width = {
            ideal: currentSettings.video.idealWidth,
          };
          videoConstraints.height = {
            ideal: currentSettings.video.idealHeight,
          };
        }
        if (supportedConstraints.frameRate && currentSettings.video.idealFrameRate) {
          // Try to select some decent frame rate.
          videoConstraints.advanced.push({
            frameRate: {
              ideal: currentSettings.video.idealFrameRate,
              max: currentSettings.video.maxFrameRate,
            },
          });
        }
        if (supportedConstraints.deviceId && videoSource && currentSettings.videoSourceId === videoSource) {
          // Select camera as requested.
          videoConstraints.deviceId = {
            exact: videoSource,
          };
        } else {
          if (supportedConstraints.facingMode && currentSettings.video.facingMode) {
            // Try to select camera facing as requested.
            videoConstraints.advanced.push({facingMode: currentSettings.video.facingMode});
          }
        }
      }

      if (audio) {
        if (supportedConstraints.deviceId && audioSource && currentSettings.audioSourceId === audioSource) {
          audioConstraints.deviceId = {
            exact: audioSource,
          };
        }
        if (supportedConstraints.echoCancellation && currentSettings.audio.echoCancellation !== undefined) {
          audioConstraints.echoCancellation = {
            ideal: currentSettings.audio.echoCancellation,
          };
        }
        if (supportedConstraints.autoGainControl && currentSettings.audio.autoGainControl !== undefined) {
          audioConstraints.autoGainControl = {
            ideal: currentSettings.audio.autoGainControl,
          };
        }
        if (supportedConstraints.noiseSuppression && currentSettings.audio.noiseSuppression !== undefined) {
          audioConstraints.noiseSuppression = {
            ideal: currentSettings.audio.noiseSuppression,
          };
        }
        if (supportedConstraints.channelCount && currentSettings.audio.channelCount !== undefined) {
          if (currentSettings.audio.channelCount > 1) {
            audioConstraints.channelCount = {
              exact: currentSettings.audio.channelCount,
            };
          } else {
            audioConstraints.channelCount = {
              ideal: currentSettings.audio.channelCount,
              min: 1,
            };
          }
        }
      }

      // Apply.
      if (video && videoSource !== null) {
        if (videoConstraints.advanced.length === 0) {
          delete videoConstraints.advanced;
        }
        constraints.video = videoConstraints;
      } else
        constraints.video = false;
      if (audio && audioSource !== null) {
        if (audioConstraints.advanced.length === 0) {
          delete audioConstraints.advanced;
        }
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
        console.debug('requestUserMedia no constraints', // eslint-disable-line no-console
          idx, status);
        return null;
      }
      if (!constraints.audio && !constraints.video) {
        // Neither audio nor video -> return no stream.
        console.debug('requestUserMedia, neither audio nor video', idx, status); // eslint-disable-line no-console
        return null;
      }
      return navigator.mediaDevices.getUserMedia(constraints).then(async stream => {
        await dispatch(userMediaSuccess(id, audio, video, constraints));
        return stream;
      }).catch(err => {
        dispatch(userMediaError(err, id, audio, video, constraints));
        throw new Error('getUserMedia failed: ' + err);
      });
    }).then(async stream => {
      // Process stream.
      console.debug('gUM stream', idx, stream); // eslint-disable-line no-console
      if (idx !== status.idx) {
        console.debug('requestUserMedia is outdated after gUM', // eslint-disable-line no-console
          idx, status);
        if (stream !== null) {
          stopMediaStream(stream);
        }
        // Return result promise. This is resolved on success of a gUM call.
        return result;
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
        if (globalSettings.keepOldStreamAndReplaceTracks) {
          // Keep stream, just replace tracks.
          // NOTE(longsleep): Is this a good idea? Check support for this.
          info.stream = status.stream;
          info.removedTracks = [];
          info.newTracks = [];
          const oldTracks = status.stream.getTracks();
          const newTracks = stream.getTracks();
          for (const track of oldTracks) {
            // Remember.
            info.removedTracks.push(track);
            // Stop old track.
            track.stop();
            // Remove old track from existing stream.
            removeTrackFromStream(status.stream, track);
          }
          for (const track of newTracks) {
            // Remember.
            info.newTracks.push(track);
            // Add new track to existing stream.
            addTrackToStream(status.stream, track);
            // Remove new track from new stream.
            removeTrackFromStream(stream, track);
          }
        } else {
          // Ensure to stop old stream.
          stopMediaStream(status.stream, false);
        }
      }
      // Optimize track encoding for content.  See https://www.w3.org/TR/mst-content-hint/.
      for (const track of stream.getTracks()) {
        if ('contentHint' in track) {
          switch (track.kind) {
            case 'video':
              track.contentHint = 'motion';
              break;
            case 'audio':
              track.contentHint = 'speech';
              break;
          }
        }
      }

      status.stream = info.stream;
      status.resolve(info);
      await dispatch(userMediaAudioVideoStream(id, info.stream));
      return info;
    }).catch(async err => {
      status.resolve(null);
      await dispatch(userMediaAudioVideoStream(id, null));
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

function userMediaError(error, id, audio, video, constraints) {
  return {
    type: types.USERMEDIA_ERROR,
    error,
    id,
    audio,
    video,
    constraints,
  };
}

function userMediaSuccess(id, audio, video, constraints) {
  return {
    type: types.USERMEDIA_SUCCESS,
    id,
    audio,
    video,
    constraints,
  };
}

function userMediaSetDeviceIds({ audioSourceId, videoSourceId, audioSinkId } = {}) {
  return {
    type: types.USERMEDIA_SET_DEVICEIDS,
    audioSourceId,
    videoSourceId,
    audioSinkId,
  };
}

export function stopUserMedia(id='') {
  return async dispatch => {
    let status = requestUserMediaStatus[id];
    if (status) {
      status.idx++;
      if (status.stream) {
        stopMediaStream(status.stream);
        status.stream = null;
      }
      await dispatch(userMediaAudioVideoStream(id, null));
    }
  };
}

function stopMediaStream(stream, triggers=true) {
  if (stream.stop) {
    // NOTE(longsleep): Backwards compatibilty. Is this still required?
    stream.stop();
  } else {
    for (const track of stream.getTracks()) {
      track.stop();
      if (triggers) {
        // Manually trigger event, since this does not trigger when stop is
        // called directly. See https://w3c.github.io/mediacapture-main/#event-summary
        // for details.
        var event = new Event('ended');
        track.dispatchEvent(event);
      }
    }
  }
}

export function addTrackToStream(stream, track) {
  stream.addTrack(track);
  // Manually trigger event, since this does not trigger when addTrack is
  // called directly. See https://w3c.github.io/mediacapture-main/#event-summary
  // for details.
  var trackEvent = new MediaStreamTrackEvent('addtrack', {track});
  stream.dispatchEvent(trackEvent);
}

export function removeTrackFromStream(stream, track) {
  stream.removeTrack(track);
  // Manually trigger event, since this does not trigger when removeTrack is
  // called directly. See https://w3c.github.io/mediacapture-main/#event-summary
  // for details.
  var trackEvent = new MediaStreamTrackEvent('removetrack', {track});
  stream.dispatchEvent(trackEvent);
}

export function muteStreamByType(stream, mute=true, type='video', id='', settings={}) {
  // NOTE(longsleep): This keeps a status record and promise for gUM to allow
  // multiple to run at the same time.
  let status = requestUserMediaStatus[id];
  if (!status) {
    status = requestUserMediaStatus[id] = {
      id: id,
      idx: 0,
    };
  }

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
          info.removedTracks.push(track);
          track.stop();
          removeTrackFromStream(stream, track);
        }
      }
      return info;
    } else {
      return Promise.resolve().then(() => {
        if (globalSettings.muteWithAddRemoveTracks) {
          return dispatch(requestUserMedia(helpers.id, helpers.video, helpers.audio, settings)).then(async newInfo => {
            if (status.stream) {
              // Get stream, in case it has changed.
              stream = status.stream;
            }
            if (stream) {
              // Remove existing old tracks.
              const oldTracks = helpers.getTracks(stream);
              for (const track of oldTracks) {
                info.removedTracks.push(track);
                track.stop();
                removeTrackFromStream(stream, track);
              }
            }
            if (newInfo && newInfo.stream && newInfo.stream !== stream) {
              const newTracks = helpers.getTracks(newInfo.stream);
              if (stream.active) {
                // Make sure that stream we are adding to is still active.
                for (const track of newTracks) {
                  info.newTracks.push(track);
                  addTrackToStream(stream, track);
                  removeTrackFromStream(newInfo.stream, track);
                }
                info.stream = stream;
              } else {
                // Old stream is not active, use new stream.
                info.newStream = info.stream = newInfo.stream;
                info.newTracks.push(...newTracks);
                // Replace stream.
                status.stream = info.newStream;
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

export function muteVideoStream(stream, mute=true, id='', settings={}) {
  return async dispatch => {
    return dispatch(muteStreamByType(stream, mute, 'video', id, settings));
  };
}

export function muteAudioStream(stream, mute=true, id='', settings={}) {
  return async dispatch => {
    return dispatch(muteStreamByType(stream, mute, 'audio', id, settings));
  };
}

export function updateDeviceIds({ audioSourceId, videoSourceId, audioSinkId } = {}) {
  return dispatch => {
    return dispatch(userMediaSetDeviceIds({
      audioSourceId,
      videoSourceId,
      audioSinkId,
    }));
  };
}

function userMediaSetPending({ audio, video } = {}) {
  return {
    type: types.USERMEDIA_SET_PENDING,
    audio: audio ? audio : undefined,
    video: video ? video : undefined,
  };
}

function userMediaUnsetPending({ audio, video } = {}) {
  return {
    type: types.USERMEDIA_SET_PENDING,
    audio: audio ? false : undefined,
    video: video ? false : undefined,
  };
}

function displayMediaSetPending() {
  return {
    type: types.DISPLAYMEDIA_SET_PENDING,
    pending: true,
  };
}

function displayMediaUnsetPending() {
  return {
    type: types.DISPLAYMEDIA_SET_PENDING,
    pending: false,
  };
}
