import * as fromGrapi from 'kpop/es/grapi/selectors';

export function getOwnGrapiUserEntryID(store) {
  return fromGrapi.getOwnGrapiUserEntryID(store.grapi);
}
