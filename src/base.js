import { qualifyURL } from 'kpop/es/utils';

// NOTE(longsleep): Meet is supposed to be run inside /meet. Currently it is not
// possible to have it run inside another path. The basePath has no trailing slash.
export const basePath = '/meet';

// Make a stable app base URL which does not change because for other URLs
// routed to us. This URL has a trailing slash.
export const appBaseURL = window.location.href.split(`${basePath}/`)[0] + `${basePath}/`;

// Make a global AudioContext available.
let audioContext = null;
export function getAudioContext() {
  if (audioContext === null) {
    audioContext = 'AudioContext' in window ? new AudioContext() : null;
  }
  return audioContext;
}

// Helper function to qualify URLs within the apps basePath.
export function qualifyAppURL(url) {
  return qualifyURL(`${basePath}${url}`);
}

export function getCurrentAppPath() {
  return window.location.href.substr(appBaseURL.length).split('?', 2)[0].split('#', 2)[0];
}

const exports = {
  basePath,
  appBaseURL,
};
export default exports;
