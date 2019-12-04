/**
 * Middleware which allows reducers to dispatch actions asynchronously after
 * the state has been updated.
 */
const meetMiddleware = ({ dispatch }) => {
  const flush = queue => {
    for (const action of queue) {
      dispatch(action);
    }
    queue.clear();
  };

  const dispatcher = queue => action => {
    queue.add(action);
  };

  return next => async action => {
    // Create new empty queue.
    const q = new Set();
    // Trigger action, but inject our queueDispatch helper.
    const result = next({
      ...action,
      queueDispatch: dispatcher(q),
    });
    // Flush queue.
    flush(q);
    // Return result from action.
    return result;
  };
};

export default meetMiddleware;
