import 'webrtc-adapter';

import * as types from './types';

const requestUserMediaStatus = {};

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
  console.info('requestUserMedia', status, video, audio); // eslint-disable-line no-console

  return async () => {
    const { videoSource, audioSource } = await enumerateDevices();

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
        if (idx !== status.idx) {
          stopUserMediaStream(stream);
          return null;
        }

        if (status.stream) {
          // Stop previous stream.
          stopUserMediaStream(status.stream);
        }
        status.stream = stream;
        return stream;
      });
  };
}

export function stopUserMedia(id='') {
  return async () => {
    let status = requestUserMediaStatus[id];
    if (status) {
      status.idx++;
      if (status.stream) {
        stopUserMediaStream(status.stream);
        status.stream = null;
      }

    }
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
