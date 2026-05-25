import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { SpotifyAttribution } from './SpotifyAttribution';

describe('SpotifyAttribution', () => {
  test('renders official Spotify logo inside the outbound attribution link', () => {
    render(<SpotifyAttribution externalUrl="https://open.spotify.com/track/mock" />);

    const link = screen.getByRole('link', { name: /listen on spotify/i });
    expect(link).toHaveAttribute('href', 'https://open.spotify.com/track/mock');
    expect(screen.getByAltText('Spotify')).toHaveAttribute(
      'src',
      '/spotify-full-logo-white.svg'
    );
  });
});
