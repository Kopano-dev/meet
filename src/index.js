import 'kpop/static/css/base.css';
import 'kpop/static/css/scrollbar.css';
import 'typeface-roboto';
import './app.css';
import './kpop-shame.css';

import * as kpop from 'kpop/es/version';
import initialize from 'kpop/es/oidc/initialize';

import * as version from './version';
import { appBaseURL } from './base';

// Early async OIDC initializ and code splitting.
initialize(appBaseURL).then(() => {
  console.info(`Kopano Meet build version: ${version.build}`); // eslint-disable-line no-console
  console.info(`Kopano Kpop build version: ${kpop.build}`); // eslint-disable-line no-console

  import(/* webpackChunkName: "meet-app" */ './meet');
}).catch(err => {
  console.error('Early initialize error', err); // eslint-disable-line no-console
});
