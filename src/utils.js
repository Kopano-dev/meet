export function avatarName(name) {
  return name.split(' ', 2).map(str => str ? str[0].toUpperCase(): '').reduce((left, right) => left + right);
}

export function qualifyURL(url) {
  const a = document.createElement('a');
  a.href = url;
  return a.href;
}

export function getHeadersFromConfig(config, user, additionalHeaders) {
  const headers = new Headers({
    'Kopano-XSRF': '1',
  });
  if (user) {
    if (user.access_token && user.token_type) {
      headers.set('Authorization', `${user.token_type} ${user.access_token}`);
    } else if (user.profile.sub) {
      // TODO(longsleep): This is for debugging only, remove or put behind a flag.
      headers.set('X-Kopano-UserEntryID', user.profile.sub || '');
    }
  }
  if (additionalHeaders) {
    for (let name in additionalHeaders) {
      if (additionalHeaders.hasOwnProperty(name)) {
        headers.set(name, additionalHeaders[name]);
      }
    }
  }

  return headers;
}

export function debounce(callable, delay=250) {
  let t = null;
  let resolvers = [];

  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => {
      let r = callable(...args);
      resolvers.forEach(resolver => resolver(r));
      resolvers = [];
    }, delay);

    return new Promise(resolver => resolvers.push(resolver));
  };
}

export function forceBase64URLEncoded(s) {
  // Converts Base64 Standard encoded string to Base64 URL encoded string. See
  // https://tools.ietf.org/html/rfc4648#section-5 for the specification.
  return s.replace(/\+/g, '-').replace(/\//, '_');
}

export function forceBase64StdEncoded(s) {
  // Converts Base64 URL encoded string to Base64 Standard encoded string. See
  // https://tools.ietf.org/html/rfc4648#section-5 for the specification.
  return s.replace(/-/g, '+').replace(/_/, '/');
}
