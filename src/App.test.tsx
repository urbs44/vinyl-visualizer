import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import App from './App';

function renderWithQuery(ui: ReactNode) {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

test('renders login when unauthenticated and not in mock mode', () => {
  renderWithQuery(<App />);
  expect(screen.getByText('VinylVision')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /connect spotify/i })).toBeInTheDocument();
});
