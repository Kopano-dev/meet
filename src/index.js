import 'kpop/es/styles/kpop';
import 'typeface-roboto';
import './app.css';
import './kpop-shame.css';

import * as version from './version';
import * as kpop from 'kpop/es/version';

// Top level poor man's minimal URL routing. This also is async and thus enables
// code splitting via Webpack.
if (window.location.pathname.indexOf('/oidc-silent-refresh.html') >= 0) {
  import('./oidc-silent-refresh');
} else {
  console.info(`Kopano Meet build version: ${version.build}`); // eslint-disable-line no-console
  console.info(`Kopano Kpop build version: ${kpop.build}`); // eslint-disable-line no-console
  import('./meet');
}
