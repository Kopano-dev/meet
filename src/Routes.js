import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { Switch, Redirect, Route } from 'react-router-dom';

import AsyncComponent from 'kpop/es/AsyncComponent';
import BaseContext from 'kpop/es/BaseContainer/BaseContext';
import { isLoadAfterUpdate } from 'kpop/es/config/utils';

import UserRequired from './components/UserRequired';

const AsyncMeet = AsyncComponent(() =>
  import(/* webpackChunkName: "containers-meet" */ './containers/Meet'));
const AsyncJoin = AsyncComponent(() =>
  import(/* webpackChunkName: "containers-join" */ './containers/Join'));

let firstRouteDone = false;
const Routes = ({ authenticated, auto }) => (
  <Switch>
    <RouteFirstRoute
      path={[
        '/r/join/:view(conference|group)/:id(.*)',
      ]}
      component={AsyncJoin}
    />
    <AuthenticatedRouteFirstRouteRedirect /* Keep this route last, its kind of a catch all. */
      path={[
        '/r/:view(call|conference|group)/:id(.*)',
        '/r/call',
      ]}
      component={AsyncMeet}
      authenticated={authenticated}
      alternative={UserRequired}
      auto={auto}
    />
    <Redirect to="/r/call"/>
  </Switch>
);

Routes.propTypes = {
  authenticated: PropTypes.bool.isRequired,
};

function RouteFirstRoute(props) {
  firstRouteDone = true;

  return <Route
    {...props}
  ></Route>;
}

function AuthenticatedRouteFirstRouteRedirect({ component: C, authenticated, props: childProps, alternative: A, auto, ...rest }) {
  const base = React.useContext(BaseContext);

  const isReadyByDefault = !base || !base.config || !base.config.continue;
  const [ready, setReady] = useState(isReadyByDefault);

  return <Route
    {...rest}
    render={props => {
      const { match, location } = props;

      if (!firstRouteDone) {
        firstRouteDone = true;
        if (
          !auto &&
          match &&
          match.params.view &&
          match.params.view !== 'call' &&
          match.params.id &&
          !isLoadAfterUpdate()
        ) {
          // Redirect to join flow for this particular group.
          return <Redirect to={{
            pathname: '/r/join/' + match.url.substr(3),
            search: location.search || '',
            hash: location.hash || '',
          }}/>;
        }
      }

      if (!isReadyByDefault) {
        // Ensure our configuration gets completed.
        Promise.resolve().then(async () => {
          if (!isReadyByDefault) {
            await base.config.continue();
            setReady(true);
          }
        });
      }
      if (!ready) {
        return null;
      }
      return authenticated
        ? <C {...props} {...childProps} />
        : A !== undefined ? <A  {...props}/> : null;
    }}
  />;
};

AuthenticatedRouteFirstRouteRedirect.propTypes = {
  component: PropTypes.elementType.isRequired,
  alternative: PropTypes.elementType,
  authenticated: PropTypes.bool.isRequired,
  props: PropTypes.object,
};


export default Routes;
