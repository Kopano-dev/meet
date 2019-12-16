import React from 'react';
import ReactDOM from 'react-dom';

import CallView from './CallView';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <CallView></CallView>, div);
});
