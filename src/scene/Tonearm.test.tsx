import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import type { TurntableState } from '../playback/deriveTurntableState';
import { Tonearm } from './Tonearm';
import { TONEARM_GEOMETRY } from './tonearmGeometry';

const BASE_STATE: TurntableState = {
  kind: 'track',
  isPlaying: true,
  transitionKey: 'spotify:track:test',
  title: 'Test Track',
  subtitle: 'Test Artist',
  artworkUrl: null,
  externalUrl: null,
};

describe('Tonearm', () => {
  test('renders playing pose in cabinet coordinates', () => {
    render(<Tonearm state={BASE_STATE} />);

    expect(screen.getByTestId('tonearm-svg')).toHaveAttribute('viewBox', TONEARM_GEOMETRY.viewBox);
    expect(screen.getByTestId('tonearm-arm')).toHaveStyle({ transform: 'rotate(0deg)' });
    expect(screen.getByTestId('tonearm-stylus')).toHaveAttribute(
      'cx',
      String(TONEARM_GEOMETRY.stylus.x)
    );
  });

  test('rotates to the rest pose when paused', () => {
    render(<Tonearm state={{ ...BASE_STATE, isPlaying: false }} />);

    expect(screen.getByTestId('tonearm-arm')).toHaveStyle({ transform: 'rotate(28deg)' });
  });
});
