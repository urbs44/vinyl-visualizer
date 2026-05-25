import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import type { TurntableState } from '../playback/deriveTurntableState';
import { SleeveCard } from './SleeveCard';

const BASE_STATE: TurntableState = {
  kind: 'track',
  isPlaying: true,
  transitionKey: 'spotify:track:test',
  title: 'Mock Anthem',
  subtitle: 'Mock Artist',
  albumName: 'Mock Album',
  artworkUrl: 'https://i.scdn.co/image/mock',
  externalUrl: 'https://open.spotify.com/track/mock',
};

describe('SleeveCard', () => {
  test('uses plain artwork container instead of an empty link when externalUrl is absent', () => {
    render(<SleeveCard state={{ ...BASE_STATE, externalUrl: null }} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByAltText('Mock Anthem - Mock Artist')).toBeInTheDocument();
  });

  test('renders the Spotify logo in the outbound sleeve action', () => {
    render(<SleeveCard state={BASE_STATE} />);

    expect(screen.getByRole('link', { name: /listen on spotify/i })).toHaveAttribute(
      'href',
      'https://open.spotify.com/track/mock'
    );
    expect(screen.getByAltText('Spotify')).toHaveAttribute(
      'src',
      '/spotify-full-logo-white.svg'
    );
  });
});
