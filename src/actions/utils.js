export function pushHistory(history, path, state) {
  // Simple helper to push the history, keeping the current query and hash.
  history.push(path + window.location.search + window.location.hash, state);
}
