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
