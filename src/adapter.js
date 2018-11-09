import * as adapter from 'webrtc-adapter';

if (adapter.browserDetails.browser === 'edge') {
  // HACK(longsleep): Prevent SimplePeer from thinking Edge is chrome.
  // See https://github.com/feross/simple-peer/blob/4dcc8a7092e515297613cf2e41197aeb53986248/index.js#L38
  window.webkitRTCPeerConnection = undefined;

  // Additional hacks for Edge.
  fakeDataChannelSupport();
}

// DataChannel support not exist with Edge, but SimplePeer requires it. This
// adds a fake instead which does nothing, but lets SimplePeer succeed.
export function fakeDataChannelSupport() {
  if (window.RTCPeerConnection.prototype.createDataChannel) {
    return;
  }
  window.RTCPeerConnection.prototype.createDataChannel = function() {
    // Return something which looks like a RTCDataChannel.
    return new FakeDataChannel();
  };
}

export class FakeDataChannel {
  close() {}
  send() {}
}
