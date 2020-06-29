import { createSelector } from 'reselect';

import { SCREENSHARE_SCREEN_ID } from '../actions/meet';

export const getStreams = (state) => state.streams;

export const getStreamsByType = createSelector(
  [ getStreams ],
  (streams) => {
    const remoteAudioVideoStreams = [];
    const remoteScreenshareStreams = [];
    for (const stream of Object.values(streams)) {
      remoteAudioVideoStreams.push(stream);
      if (stream.announces) {
        for (const announce of Object.values(stream.announces)) {
          if (announce.kind === 'screenshare' && announce.id === SCREENSHARE_SCREEN_ID) {
            remoteScreenshareStreams.push(stream);
          }
        }
      }
    }

    return {
      remoteAudioVideoStreams,
      remoteScreenshareStreams,
    };
  }
);
