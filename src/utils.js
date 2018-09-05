export function debounce(callable, delay=250) {
  let t = null;
  let resolvers = [];
  let cancelled = false;

  const cancel = () => {
    cancelled = true;
    clearTimeout(t);
  };

  return (...args) => {
    t = setTimeout(() => {
      if (cancelled) {
        return;
      }
      let r = callable(...args);
      resolvers.forEach(resolver => resolver(r));
      resolvers = [];
    }, delay);

    // Create new promise with cancel support.
    const p = new Promise(resolver => resolvers.push(resolver));
    p.cancel = cancel;

    return p;
  };
}
