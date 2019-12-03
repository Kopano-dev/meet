/*!
 *
 * Copyright (c) 2014 The WebRTC project authors. All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *
 *   * Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in
 *     the documentation and/or other materials provided with the
 *     distribution.
 *
 *   * Neither the name of Google nor the names of its contributors may
 *     be used to endorse or promote products derived from this software
 *     without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

// Firefox implements send bandwidth restrictions using standard conforming TIAS
// while Chromeium does not. Set a flag when Firefox.
// See https://bugzilla.mozilla.org/show_bug.cgi?id=1276368 for details.
const withTIAS = !!navigator.mozGetUserMedia;

const defaultParams = {
};

const trace = (...params) => {
  console.debug('sdputils', ...params); //  eslint-disable-line no-console
};

export function mergeConstraints(cons1, cons2) {
  if (!cons1 || !cons2) {
    return cons1 || cons2;
  }
  var merged = cons1;
  for (var key in cons2) {
    merged[key] = cons2[key];
  }
  return merged;
}

export function iceCandidateType(candidateStr) {
  return candidateStr.split(' ')[7];
}

export function maybeSetOpusOptions(sdp, {
  opusStereo,
  opusSpropStereo,
  opusFec,
  opusDtx,
  opusMaxPbr,
} = defaultParams) {
  // Set Opus in Stereo, if stereo is true, unset it, if stereo is false, and
  // do nothing if otherwise.
  if (opusStereo) {
    sdp = setCodecParam(sdp, 'opus/48000', 'stereo', '1');
  } else if (opusStereo === false) {
    sdp = removeCodecParam(sdp, 'opus/48000', 'stereo');
  }

  // Set Opus likely sending stereo. if opusSpropStereo is troue, unset if, if
  // it is false and do nothing otherwise.
  if (opusSpropStereo) {
    sdp = setCodecParam(sdp, 'opus/48000', 'sprop-stereo', '1');
  } else if (opusSpropStereo === false) {
    sdp = removeCodecParam(sdp, 'opus/48000', 'sprop-stereo');
  }

  // Set Opus FEC, if opusfec is true, unset it, if opusfec is false, and
  // do nothing if otherwise.
  if (opusFec) {
    sdp = setCodecParam(sdp, 'opus/48000', 'useinbandfec', '1');
  } else if (opusFec === false) {
    sdp = removeCodecParam(sdp, 'opus/48000', 'useinbandfec');
  }

  // Set Opus DTX, if opusdtx is true, unset it, if opusdtx is false, and
  // do nothing if otherwise.
  if (opusDtx) {
    sdp = setCodecParam(sdp, 'opus/48000', 'usedtx', '1');
  } else if (opusDtx === false) {
    sdp = removeCodecParam(sdp, 'opus/48000', 'usedtx');
  }

  // Set Opus maxplaybackrate, if requested.
  if (opusMaxPbr) {
    sdp = setCodecParam(
      sdp, 'opus/48000', 'maxplaybackrate', opusMaxPbr);
  }
  return sdp;
}

export function maybeSetAudioSendBitRate(sdp, {
  audioSendBitrate,
} = defaultParams) {
  if (!audioSendBitrate) {
    return sdp;
  }
  trace('Prefer audio send bitrate: ' + audioSendBitrate);
  return preferBitRate(sdp, audioSendBitrate, 'audio');
}

export function maybeSetAudioReceiveBitRate(sdp, {
  audioRecvBitrate,
} = defaultParams) {
  if (!audioRecvBitrate) {
    return sdp;
  }
  trace('Prefer audio receive bitrate: ' + audioRecvBitrate);
  return preferBitRate(sdp, audioRecvBitrate, 'audio');
}

export function maybeSetVideoSendBitRate(sdp, {
  videoSendBitrate,
}) {
  if (!videoSendBitrate) {
    return sdp;
  }
  trace('Prefer video send bitrate: ' + videoSendBitrate);
  return preferBitRate(sdp, videoSendBitrate, 'video');
}

export function maybeSetVideoReceiveBitRate(sdp, {
  videoRecvBitrate,
}) {
  if (!videoRecvBitrate) {
    return sdp;
  }
  trace('Prefer video receive bitrate: ' + videoRecvBitrate);
  return preferBitRate(sdp, videoRecvBitrate, 'video');
}

// Add a b=AS:bitrate line to the m=mediaType section. This os only supported in
// Chromium. Firefox implements b=TIAS lines which are not handled by this
export function preferBitRate(sdp, bitrate, mediaType, variant=withTIAS ? 'TIAS' : 'AS', start=0) {
  var sdpLines = sdp.split('\r\n');

  // Find m line for the given mediaType.
  var mLineIndex = findLineInRange(sdpLines, start, -1, 'm=', mediaType);
  if (mLineIndex === null) {
    if (start === 0) {
      trace('Failed to add bandwidth line to sdp, as no m-line found'); // eslint-disable-line i18n-text/no-en
    }
    return sdp;
  }

  // Find next m-line if any.
  var nextMLineIndex = findLineInRange(sdpLines, mLineIndex + 1, -1, 'm=');
  if (nextMLineIndex === null) {
    nextMLineIndex = sdpLines.length;
  } else {
    sdp = preferBitRate(sdp, bitrate, mediaType, variant, nextMLineIndex);
    sdpLines = sdp.split('\r\n');
  }

  // Find c-line corresponding to the m-line.
  var cLineIndex = findLineInRange(sdpLines, mLineIndex + 1,
    nextMLineIndex, 'c=');
  if (cLineIndex === null) {
    trace('Failed to add bandwidth line to sdp, as no c-line found'); // eslint-disable-line i18n-text/no-en
    return sdp;
  }

  // Check if bandwidth line already exists between c-line and next m-line.
  var bLineIndex = findLineInRange(sdpLines, cLineIndex + 1,
    nextMLineIndex, `b=${variant}`);
  if (bLineIndex) {
    sdpLines.splice(bLineIndex, 1);
  }

  if (variant === 'TIAS') {
    // TIAS uses kbps while AS uses bps.
    bitrate = bitrate * 1000 * 0.95 - (50 * 40 * 8);
    // The 50 is based on 50 packets per second, the 40 is based on an
    // estimate of total header size, the 1000 changes the unit from
    // kbps to bps (as required by TIAS), and the 0.95 is to allocate
    // 5% to RTCP. "TIAS" is used in preference to "AS" because it
    // provides more accurate control of bandwidth.
  }

  // Create the b (bandwidth) sdp line.
  var bwLine = `b=${variant}:${bitrate}`;
  // As per RFC 4566, the b line should follow after c-line.
  sdpLines.splice(cLineIndex + 1, 0, bwLine);
  sdp = sdpLines.join('\r\n');
  return sdp;
}

// Add an a=fmtp: x-google-min-bitrate=kbps line, if videoSendInitialBitrate
// is specified. We'll also add a x-google-min-bitrate value, since the max
// must be >= the min.
export function maybeSetVideoSendInitialBitRate(sdp, {
  videoSendInitialBitrate,
  videoSendBitrate,
  videoSendCodec,
} = defaultParams) {
  var initialBitrate = parseInt(videoSendInitialBitrate, 10);
  if (!initialBitrate) {
    return sdp;
  }

  // Validate the initial bitrate value.
  var maxBitrate = parseInt(initialBitrate, 10);
  var bitrate = parseInt(videoSendBitrate, 10);
  if (bitrate) {
    if (initialBitrate > bitrate) {
      trace('Clamping initial bitrate to max bitrate of ' + bitrate + ' kbps.');
      initialBitrate = bitrate;
      videoSendInitialBitrate = initialBitrate;
    }
    maxBitrate = bitrate;
  }

  var sdpLines = sdp.split('\r\n');

  // Search for m line.
  var mLineIndex = findLine(sdpLines, 'm=', 'video');
  if (mLineIndex === null) {
    trace('Failed to find video m-line'); // eslint-disable-line i18n-text/no-en
    return sdp;
  }
  // Figure out the first codec payload type on the m=video SDP line.
  var videoMLine = sdpLines[mLineIndex];
  var pattern = new RegExp('m=video\\s\\d+\\s[A-Z/]+\\s');
  var sendPayloadType = videoMLine.split(pattern)[1].split(' ')[0];
  var fmtpLine = sdpLines[findLine(sdpLines, 'a=rtpmap', sendPayloadType)];
  var codecName = fmtpLine.split('a=rtpmap:' +
      sendPayloadType)[1].split('/')[0];

  // Use codec from params if specified via URL param, otherwise use from SDP.
  var codec = videoSendCodec || codecName;
  sdp = setCodecParam(sdp, codec, 'x-google-min-bitrate',
    videoSendInitialBitrate.toString());
  sdp = setCodecParam(sdp, codec, 'x-google-max-bitrate',
    maxBitrate.toString());

  return sdp;
}

function removePayloadTypeFromMline(mLine, payloadType) {
  mLine = mLine.split(' ');
  for (var i = 0; i < mLine.length; ++i) {
    if (mLine[i] === payloadType.toString()) {
      mLine.splice(i, 1);
    }
  }
  return mLine.join(' ');
}

function removeCodecByName(sdpLines, codec) {
  var index = findLine(sdpLines, 'a=rtpmap', codec);
  if (index === null) {
    return sdpLines;
  }
  var payloadType = getCodecPayloadTypeFromLine(sdpLines[index]);
  sdpLines.splice(index, 1);

  // Search for the video m= line and remove the codec.
  var mLineIndex = findLine(sdpLines, 'm=', 'video');
  if (mLineIndex === null) {
    return sdpLines;
  }
  sdpLines[mLineIndex] = removePayloadTypeFromMline(sdpLines[mLineIndex],
    payloadType);
  return sdpLines;
}

function removeCodecByPayloadType(sdpLines, payloadType) {
  var index = findLine(sdpLines, 'a=rtpmap', payloadType.toString());
  if (index === null) {
    return sdpLines;
  }
  sdpLines.splice(index, 1);

  // Search for the video m= line and remove the codec.
  var mLineIndex = findLine(sdpLines, 'm=', 'video');
  if (mLineIndex === null) {
    return sdpLines;
  }
  sdpLines[mLineIndex] = removePayloadTypeFromMline(sdpLines[mLineIndex],
    payloadType);
  return sdpLines;
}

export function maybeRemoveVideoFec(sdp, {
  videoFec,
} = defaultParams) {
  if (videoFec !== 'false') {
    return sdp;
  }

  var sdpLines = sdp.split('\r\n');

  var index = findLine(sdpLines, 'a=rtpmap', 'red');
  if (index === null) {
    return sdp;
  }
  var redPayloadType = getCodecPayloadTypeFromLine(sdpLines[index]);
  sdpLines = removeCodecByPayloadType(sdpLines, redPayloadType);

  sdpLines = removeCodecByName(sdpLines, 'ulpfec');

  // Remove fmtp lines associated with red codec.
  index = findLine(sdpLines, 'a=fmtp', redPayloadType.toString());
  if (index === null) {
    return sdp;
  }
  var fmtpLine = parseFmtpLine(sdpLines[index]);
  var rtxPayloadType = fmtpLine.pt;
  if (rtxPayloadType === null) {
    return sdp;
  }
  sdpLines.splice(index, 1);

  sdpLines = removeCodecByPayloadType(sdpLines, rtxPayloadType);
  return sdpLines.join('\r\n');
}

// Promotes |audioSendCodec| to be the first in the m=audio line, if set.
export function maybePreferAudioSendCodec(sdp, {
  audioSendCodec,
} = defaultParams) {
  return maybePreferCodec(sdp, 'audio', 'send', audioSendCodec);
}

// Promotes |audioRecvCodec| to be the first in the m=audio line, if set.
export function maybePreferAudioReceiveCodec(sdp, {
  audioRecvCodec,
} = defaultParams) {
  return maybePreferCodec(sdp, 'audio', 'receive', audioRecvCodec);
}

// Promotes |videoSendCodec| to be the first in the m=audio line, if set.
export function maybePreferVideoSendCodec(sdp, {
  videoSendCodec,
} = defaultParams) {
  return maybePreferCodec(sdp, 'video', 'send', videoSendCodec);
}

// Promotes |videoRecvCodec| to be the first in the m=audio line, if set.
export function maybePreferVideoReceiveCodec(sdp, {
  videoRecvCodec,
} = defaultParams) {
  return maybePreferCodec(sdp, 'video', 'receive', videoRecvCodec);
}

// Sets |codec| as the default |type| codec if it's present.
// The format of |codec| is 'NAME/RATE', e.g. 'opus/48000'.
export function maybePreferCodec(sdp, type, dir, codec) {
  var str = type + ' ' + dir + ' codec';
  if (!codec) {
    trace('No preference on ' + str + '.');
    return sdp;
  }

  trace('Prefer ' + str + ': ' + codec);

  var sdpLines = sdp.split('\r\n');

  // Search for m line.
  var mLineIndex = findLine(sdpLines, 'm=', type);
  if (mLineIndex === null) {
    return sdp;
  }

  // If the codec is available, set it as the default in m line.
  var payload = null;
  // Iterate through rtpmap enumerations to find all matching codec entries
  for (var i = sdpLines.length-1; i >= 0 ; --i) {
    // Finds first match in rtpmap
    var index = findLineInRange(sdpLines, i, 0, 'a=rtpmap', codec, 'desc');
    if (index !== null) {
      // Skip all of the entries between i and index match
      i = index;
      payload = getCodecPayloadTypeFromLine(sdpLines[index]);
      if (payload) {
        // Move codec to top
        sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], payload);
      }
    } else {
      // No match means we can break the loop
      break;
    }
  }

  sdp = sdpLines.join('\r\n');
  return sdp;
}

// Set fmtp param to specific codec in SDP. If param does not exists, add it.
export function setCodecParam(sdp, codec, param, value) {
  var sdpLines = sdp.split('\r\n');

  var fmtpLineIndex = findFmtpLine(sdpLines, codec);

  var fmtpObj = {};
  if (fmtpLineIndex === null) {
    var index = findLine(sdpLines, 'a=rtpmap', codec);
    if (index === null) {
      return sdp;
    }
    var payload = getCodecPayloadTypeFromLine(sdpLines[index]);
    fmtpObj.pt = payload.toString();
    fmtpObj.params = {};
    fmtpObj.params[param] = value;
    sdpLines.splice(index + 1, 0, writeFmtpLine(fmtpObj));
  } else {
    fmtpObj = parseFmtpLine(sdpLines[fmtpLineIndex]);
    fmtpObj.params[param] = value;
    sdpLines[fmtpLineIndex] = writeFmtpLine(fmtpObj);
  }

  sdp = sdpLines.join('\r\n');
  return sdp;
}

// Remove fmtp param if it exists.
export function removeCodecParam(sdp, codec, param) {
  var sdpLines = sdp.split('\r\n');

  var fmtpLineIndex = findFmtpLine(sdpLines, codec);
  if (fmtpLineIndex === null) {
    return sdp;
  }

  var map = parseFmtpLine(sdpLines[fmtpLineIndex]);
  delete map.params[param];

  var newLine = writeFmtpLine(map);
  if (newLine === null) {
    sdpLines.splice(fmtpLineIndex, 1);
  } else {
    sdpLines[fmtpLineIndex] = newLine;
  }

  sdp = sdpLines.join('\r\n');
  return sdp;
}

// Split an fmtp line into an object including 'pt' and 'params'.
function parseFmtpLine(fmtpLine) {
  var fmtpObj = {};
  var spacePos = fmtpLine.indexOf(' ');
  var keyValues = fmtpLine.substring(spacePos + 1).split(';');

  var pattern = new RegExp('a=fmtp:(\\d+)');
  var result = fmtpLine.match(pattern);
  if (result && result.length === 2) {
    fmtpObj.pt = result[1];
  } else {
    return null;
  }

  var params = {};
  for (var i = 0; i < keyValues.length; ++i) {
    var pair = keyValues[i].split('=');
    if (pair.length === 2) {
      params[pair[0]] = pair[1];
    }
  }
  fmtpObj.params = params;

  return fmtpObj;
}

// Generate an fmtp line from an object including 'pt' and 'params'.
function writeFmtpLine(fmtpObj) {
  if (!fmtpObj.hasOwnProperty('pt') || !fmtpObj.hasOwnProperty('params')) { /* eslint-disable-line no-prototype-builtins */
    return null;
  }
  var pt = fmtpObj.pt;
  var params = fmtpObj.params;
  var keyValues = [];
  var i = 0;
  for (var key in params) {
    keyValues[i] = key + '=' + params[key];
    ++i;
  }
  if (i === 0) {
    return null;
  }
  return 'a=fmtp:' + pt.toString() + ' ' + keyValues.join(';');
}

// Find fmtp attribute for |codec| in |sdpLines|.
function findFmtpLine(sdpLines, codec) {
  // Find payload of codec.
  var payload = getCodecPayloadType(sdpLines, codec);
  // Find the payload in fmtp line.
  return payload ? findLine(sdpLines, 'a=fmtp:' + payload.toString()) : null;
}

// Find the line in sdpLines that starts with |prefix|, and, if specified,
// contains |substr| (case-insensitive search).
function findLine(sdpLines, prefix, substr) {
  return findLineInRange(sdpLines, 0, -1, prefix, substr);
}

// Find the line in sdpLines[startLine...endLine - 1] that starts with |prefix|
// and, if specified, contains |substr| (case-insensitive search).
function findLineInRange(
  sdpLines,
  startLine,
  endLine,
  prefix,
  substr,
  direction
) {
  if (direction === undefined) {
    direction = 'asc';
  }

  direction = direction || 'asc';

  if (direction === 'asc') {
    // Search beginning to end
    var realEndLine = endLine !== -1 ? endLine : sdpLines.length;
    for (var i = startLine; i < realEndLine; ++i) {
      if (sdpLines[i].indexOf(prefix) === 0) {
        if (!substr ||
            sdpLines[i].toLowerCase().indexOf(substr.toLowerCase()) !== -1) {
          return i;
        }
      }
    }
  } else {
    // Search end to beginning
    var realStartLine = startLine !== -1 ? startLine : sdpLines.length-1;
    for (var j = realStartLine; j >= 0; --j) {
      if (sdpLines[j].indexOf(prefix) === 0) {
        if (!substr ||
            sdpLines[j].toLowerCase().indexOf(substr.toLowerCase()) !== -1) {
          return j;
        }
      }
    }
  }
  return null;
}

// Gets the codec payload type from sdp lines.
function getCodecPayloadType(sdpLines, codec) {
  var index = findLine(sdpLines, 'a=rtpmap', codec);
  return index ? getCodecPayloadTypeFromLine(sdpLines[index]) : null;
}

// Gets the codec payload type from an a=rtpmap:X line.
function getCodecPayloadTypeFromLine(sdpLine) {
  var pattern = new RegExp('a=rtpmap:(\\d+) [a-zA-Z0-9-]+\\/\\d+');
  var result = sdpLine.match(pattern);
  return (result && result.length === 2) ? result[1] : null;
}

// Returns a new m= line with the specified codec as the first one.
function setDefaultCodec(mLine, payload) {
  var elements = mLine.split(' ');

  // Just copy the first three parameters; codec order starts on fourth.
  var newLine = elements.slice(0, 3);

  // Put target payload first and copy in the rest.
  newLine.push(payload);
  for (var i = 3; i < elements.length; i++) {
    if (elements[i] !== payload) {
      newLine.push(elements[i]);
    }
  }
  return newLine.join(' ');
}
