import { forceBase64URLEncoded, forceBase64StdEncoded } from 'kpop/es/utils';
import { qualifyAppURL } from './base';

// NOTE(longsleep): Poor mans check if on mobile.
export const isMobile = /(Mobi|Android)/.test(navigator.userAgent);
export const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints;

export const defaultPublicGroupPrefix = 'public/';
export const defaultGroupScope= 'group';
export const defaultPublicGroupRegexp = '^(group|conference)/public/.*';

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

function matchPublicGroup(group, config) {
  const publicGroupRegexp = (config && config.guests && config.guests.publicGroupRegexp) ? config.guests.publicGroupRegexp : defaultPublicGroupRegexp;

  const scope = group.scope ? group.scope : defaultGroupScope;

  const m = `${scope}/${group.id}`;

  return m.match(publicGroupRegexp);
}

export function isPublicGroup(group, config) {
  if (!group) {
    return false;
  }
  if (!config || !config.guests || !config.guests.enabled) {
    // Nothing is a public group when guests are disabled.
    return false;
  }

  return matchPublicGroup(group, config) !== null;
}

export function makePublicGroupID(group, prefix, config) {
  if (!group) {
    return group.id;
  }
  if (!config || !config.guests || !config.guests.enabled) {
    // Nothing is a public group when guests are disabled.
    return false;
  }

  if (prefix === undefined) {
    prefix = defaultPublicGroupPrefix;
  }

  const id = prefix + group.id;
  if (!isPublicGroup({
    ...group,
    id,
  }, config)) {
    throw new Error('invalid prefix, must match configured public prefixes');
  }
  return id;
}

export function makeNonPublicGroupID(group, prefix, config) {
  if (!group) {
    return group.id;
  }
  if (!config || !config.guests || !config.guests.enabled) {
    // Nothing is a public group when guests are disabled.
    return false;
  }

  const match = matchPublicGroup(group, config);
  if (match === null) {
    return group.id;
  }

  if (prefix === undefined) {
    prefix = defaultPublicGroupPrefix;
  }

  if (group.id.indexOf(prefix) === 0) {
    return group.id.substr(defaultPublicGroupPrefix.length);
  }

  return '';
}

export function isValidGroup(group, config) {
  if (!group) {
    return false;
  }

  if (group.id.trim() === '') {
    return false;
  }

  if (!isPublicGroup(group, config)) {
    return true;
  }

  // Remove last character from public group, if its still a public group
  // without it, consider as valid.
  const id = group.id.substr(0, group.id.length - 1);
  return isPublicGroup({
    ...group,
    id,
  }, config);
}
