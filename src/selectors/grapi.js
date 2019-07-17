import { getOwnGrapiUserEntryID as _getOwnGrapiUserEntryID } from 'kpop/es/grapi/selectors';

export function getOwnGrapiUserEntryID(store) {
  return _getOwnGrapiUserEntryID(store.grapi);
}
