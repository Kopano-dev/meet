import { defineMessages } from 'react-intl';

export const ERROR_KWM_NO_PERMISSION = 'meet.kwm.no_permission';
export const ERROR_KWM_UNABLE_TO_CALL = 'meet.kwm.unable_to_call';
export const ERROR_KWM_UNABLE_TO_JOIN = 'meet.kwm.unable_to_join';
export const ERROR_KWM_UNABLE_TO_ACCEPT = 'meet.kwm.unable_to_accept';

// Translateable error messages.
/* eslint-disable i18n-text/no-en */
export const translations = defineMessages({
  [ERROR_KWM_NO_PERMISSION]: {
    id: ERROR_KWM_NO_PERMISSION,
    defaultMessage: 'No permission to access server',
  },
  [ERROR_KWM_UNABLE_TO_CALL]: {
    id: ERROR_KWM_UNABLE_TO_CALL,
    defaultMessage: 'Unable to call',
  },
  [ERROR_KWM_UNABLE_TO_CALL]: {
    id: ERROR_KWM_UNABLE_TO_CALL,
    defaultMessage: 'Unable to call',
  },
  [ERROR_KWM_UNABLE_TO_JOIN]: {
    id: ERROR_KWM_UNABLE_TO_JOIN,
    defaultMessage: 'Unable to join',
  },
  [ERROR_KWM_UNABLE_TO_ACCEPT]: {
    id: ERROR_KWM_UNABLE_TO_ACCEPT,
    defaultMessage: 'Unable to accept call',
  },
});
/* eslint-enable */
