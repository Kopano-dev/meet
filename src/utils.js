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
