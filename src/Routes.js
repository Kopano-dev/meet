import React from 'react';
import PropTypes from 'prop-types';

import { Switch } from 'react-router-dom';
import AsyncComponent from 'kpop/es/AsyncComponent';
import AuthenticatedRoute from 'kpop/es/routes/AuthenticatedRoute';

const AsyncMeet = AsyncComponent(() =>
  import(/* webpackChunkName: "containers-meet" */ './containers/Meet'));

const Routes = ({ authenticated, config }) => (
  <Switch>
    <AuthenticatedRoute /* Keep this route last, its kind of a catch all. */
      path="/r/:view(call|conference|group)?"
      component={AsyncMeet}
      authenticated={authenticated}
      config={config}
    />
  </Switch>
);

Routes.propTypes = {
  authenticated: PropTypes.bool.isRequired,
  config: PropTypes.object,
};

export default Routes;
