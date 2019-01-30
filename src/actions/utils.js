const marker = {};

export function requireScope(scope, f, defaultValue=marker) {
  return async (dispatch, getState) => {
    const { user } = getState().common;

    if (userHasScope(scope, user)) {
      return f(dispatch, getState);
    }

    if (defaultValue === marker) {
      throw new Error(`missing scope: ${scope}`);
    }
    return defaultValue;
  };
}

export const userHasScope = (scope, user) => {
  if (!scope || !user) {
    return false;
  }

  const scopes = user.scope.split(' ');
  return scopes.includes(scope);
};

export function pushHistory(history, path, state) {
  // Simple helper to push the history, keeping the current query and hash.
  history.push(path + window.location.search + window.location.hash, state);
}
