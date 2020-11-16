import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import HowlingProvider from './HowlingProvider';

test('renders without crashing', async () => {
  render(<HowlingProvider src="mock.ogg">
    <span  data-testid="loaded-true">1</span>
  </HowlingProvider>);
  await waitFor(() =>
    expect(screen.getByTestId('loaded-true')).toHaveTextContent('1'));
});
