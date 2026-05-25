import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { SpotifyLogo } from './SpotifyLogo';

describe('SpotifyLogo', () => {
  test('defaults to a comfortably above-minimum wordmark size', () => {
    render(<SpotifyLogo />);

    expect(screen.getByAltText('Spotify')).toHaveClass('h-6');
  });
});
