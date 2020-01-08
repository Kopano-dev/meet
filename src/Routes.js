import React from 'react';
import PropTypes from 'prop-types';

import { Switch, Redirect, Route } from 'react-router-dom';
import AsyncComponent from 'kpop/es/AsyncComponent';
import AuthenticatedRoute from 'kpop/es/routes/AuthenticatedRoute';

import UserRequired from './components/UserRequired';

const AsyncMeet = AsyncComponent(() =>
  import(/* webpackChunkName: "containers-meet" */ './containers/Meet'));
const AsyncJoin = AsyncComponent(() =>
  import(/* webpackChunkName: "containers-join" */ './containers/Join'));

const Routes = ({ authenticated }) => (
  <Switch>
    <Route
      path="/r/join/:view(conference|group)/:id(.*)"
      component={AsyncJoin}
    />
    <AuthenticatedRoute /* Keep this route last, its kind of a catch all. */
      path="/r/:view(call|conference|group)?"
      component={AsyncMeet}
      authenticated={authenticated}
      alternative={<UserRequired/>}
    />
    <Redirect to="/r/call"/>
  </Switch>
);

Routes.propTypes = {
  authenticated: PropTypes.bool.isRequired,
};

export default Routes;
