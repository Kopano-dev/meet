import base64 from 'binary-base64';
import { forceBase64URLEncoded } from 'kpop/es/utils';

export const maybeIsABEID = (s) => {
  return s && s.indexOf('AAAAA') === 0;
};

export const idFromABEID = (entryID) => {
  if (!maybeIsABEID(entryID)) {
    return entryID;
  }

  // Decode as base64.
  const entryIDBytes = base64.decode(entryID);
  const idBytes = entryIDBytes.slice(32); // ABEID assumed, 4 + 16 + 4 + 4 + 4 (abflags, guid, version, type, id, exid).
  let idx = idBytes.length - 1;
  while (idx >= 0) {
    let padding = idBytes[idx];
    if (padding === 0 || padding === 0x3d) { // Detects ABEID padding and Base64 padding.
      idx--;
      continue;
    }
    break;
  }

  // Use raw exid value since it is already base64 encoded. We just need to
  // ensure its URL encoded to compare it.
  return forceBase64URLEncoded(String.fromCharCode.apply(null, idBytes.slice(0, idx+1)));
};
