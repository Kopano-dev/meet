// NOTE(longsleep): This is needed, since we cannot rely on an existing installed
// service worker to send the SKIP_WAITING message. Unfortunate, but for now
// this fixes update until a better update path can be found.
self.skipWaiting();

/* Additional service worker content goes here. */
