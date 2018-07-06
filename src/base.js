import { qualifyURL } from 'kpop/es/utils';

// NOTE(longsleep): Meet is supposed to be run inside /meet. Currently it is not
// possible to have it run inside another path. The basePath has no trailing slash.
export const basePath = '/meet';

// Make a stable app base URL which does not change because for other URLs
// routed to us. This URL has a trailing slash.
export const appBaseURL = window.location.href.split(`${basePath}/`)[0] + `${basePath}/`;

// Helper function to qualify URLs within the apps basePath.
export function qualifyAppURL(url) {
  return qualifyURL(`${basePath}${url}`);
}

export default {
  basePath,
  appBaseURL,
};
