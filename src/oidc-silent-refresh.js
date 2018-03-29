import { UserManager } from 'oidc-client';

new UserManager().signinSilentCallback()
  .catch((err) => {
    console.error('silent refresh callback failed', err); // eslint-disable-line no-console
  });
