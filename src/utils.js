import { forceBase64URLEncoded, forceBase64StdEncoded } from 'kpop/es/utils';
import { qualifyAppURL } from './base';

// NOTE(longsleep): Poor mans check if on mobile.
export const isMobile = /(Mobi|Android)/.test(navigator.userAgent);
export const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints;

export const PUBLIC_GROUP_PREFIX = 'public/';

export function resolveContactID(config, contact) {
  const { useIdentifiedUser } = config;

  if (useIdentifiedUser) {
    // User principal name as is.
    return contact.userPrincipalName;
  } else {
    // Use full ABEID, but force base64Std encoded as used in kwmserver. This
    // operational mode might not support kc multiserver setups.
    return forceBase64StdEncoded(contact.id);
  }
}

export function resolveContactIDFromRecord(config, record) {
  const { useIdentifiedUser } = config;

  if (useIdentifiedUser) {
    // User principal name as is.
    return record.id;
  } else {
    // Record id is ABEID, but force base64URL encoded as used in grapi.
    return forceBase64URLEncoded(record.id);
  }
}

export function makeGroupLink(group, options, config, prefix='join/') {
  let hst = '';
  if (options) {
    const params = new URLSearchParams();
    Object.keys(options).forEach(key => {
      params.set(key, options[key]);
    });

    hst = params.toString();
    if (hst) {
      hst = '#' + hst;
    }
  }

  return qualifyAppURL(`/r/${prefix}${group.scope}/${group.id}${hst}`);
}

export function isPublicGroup(group, config) {
  return config &&
    config.guests &&
    config.guests.enabled &&
    group &&
    group.id.indexOf(PUBLIC_GROUP_PREFIX) === 0;
}
