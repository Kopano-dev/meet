export function setError(error) {
  return async (dispatch) => {
    dispatch({
      type: 'ERROR',
      error,
    });
    if (!error.fatal) {
      //dispatch(setView(ERROR_VIEW))
    }
  };
}

export function networkError(status, response) {
  return async (dispatch) => {
    const error = {
      status,
      fatal: false,
    };
    if (response) {
      error.detail = await response.text();
    }

    switch (status) {
      case 403:
        // Forbidden.
        error.message = `Error: network request forbidden (${status})`;
        error.fatal = true;
        break;

      default:
        error.message = `Error: network request failed with status ${status}`;
        break;
    }

    dispatch(setError(error));
  };
}
