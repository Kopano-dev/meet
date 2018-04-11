import 'webrtc-adapter';

import * as types from './types';

let requestUserMediaIdx = 0;

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

export function requestUserMedia(video=true, audio=true) {
  const idx = ++requestUserMediaIdx;
  console.info('requestUserMedia', requestUserMediaIdx ,video, audio); // eslint-disable-line no-console

  return async (dispatch, getState) => {
    const { videoSource, audioSource } = await enumerateDevices();
    const { audioVideoStream: oldStream } = getState().usermedia;

    const constraints = {};
    if (video) {
      constraints.video = {
        optional: [
          {
            sourceId: videoSource,
          },
        ],
      };
    }
    if (audio) {
      constraints.audio = {
        optional: [
          {
            sourceId: audioSource,
          },
        ],
      };
    }

    console.log('gUM constraints', constraints); // eslint-disable-line no-console

    return navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        console.log('gUM stream', idx, stream); // eslint-disable-line no-console
        if (idx !== requestUserMediaIdx) {
          stopUserMediaStream(stream);
          return null;
        }

        dispatch(userMediaAudioVideoStream(stream));
        if (oldStream) {
          // Stop previous stream.
          stopUserMediaStream(oldStream);
        }
        return stream;
      });
  };
}

function stopUserMediaStream(stream) {
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

export function userMediaAudioVideoStream(stream) {
  return {
    type: types.USERMEDIA_AUDIOVIDEO_STREAM,
    stream,
  };
}
