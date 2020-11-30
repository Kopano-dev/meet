import React from 'react';

import { Route, Switch } from 'react-router-dom';

import PanelMain from './PanelMain';
import PanelContact from './PanelContact';
import PanelGroup from './PanelGroup';

const SwitchPanel = (props) => {
  return <Switch>
    <Route
      exact
      path="/r/call"
      render={other => {
        return <PanelMain {...other} {...props}/>;
      }}
    ></Route>
    <Route
      exact
      path="/r/call/:id(.*)"
      render={other => {
        return <PanelContact {...other} {...props}/>;
      }}
    ></Route>
    <Route
      exact
      path="/r/:scope(conference|group)/:id(.*)?"
      render={other => {
        return <PanelGroup {...other} {...props}/>;
      }}
    ></Route>
  </Switch>;
};

export default SwitchPanel;
