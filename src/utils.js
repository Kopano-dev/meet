import { forceBase64URLEncoded, forceBase64StdEncoded } from 'kpop/es/utils';

export function pushHistory(history, path, state) {
  // Simple helper to push the history, keeping the current query and hash.
  history.push(path + window.location.search + window.location.hash, state);
}

export function resolveContactID(config, contact) {
  const { useIdentifiedUser } = config;

  if (useIdentifiedUser) {
    // User principal name as is.
    return contact.userPrincipalName;
  } else {
    // Use full ABEID, but force base64Std encoded as used in kwmserver. This
    // operational mode might not support kc multiserver setups.
    return forceBase64StdEncoded(contact.id);
  }
}

export function resolveContactIDFromRecord(config, record) {
  const { useIdentifiedUser } = config;

  if (useIdentifiedUser) {
    // User principal name as is.
    return record.id;
  } else {
    // Record id is ABEID, but force base64URL encoded as used in grapi.
    return forceBase64URLEncoded(record.id);
  }
}
