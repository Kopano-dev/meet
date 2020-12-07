import React from 'react';

import { Route, Switch } from 'react-router-dom';

import DialogsGroup from './DialogsGroup';

const SwitchDialogs = (props) => {
  return <Switch>
    <Route
      exact
      path="/r/:scope(conference|group)/:id(.*)?"
      render={other => {
        return <DialogsGroup {...other} {...props}/>;
      }}
    ></Route>
  </Switch>;
};

export default SwitchDialogs;
