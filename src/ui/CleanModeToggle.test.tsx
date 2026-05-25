import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { DEFAULT_SKIN_ID } from '../skins/skins';
import { useUiStore } from '../store/uiStore';
import { CleanModeSurface, CleanModeToggle } from './CleanModeToggle';

describe('CleanModeToggle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    useUiStore.setState({ skinId: DEFAULT_SKIN_ID, cleanMode: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('long-pressing the scene toggles clean mode', () => {
    render(
      <>
        <CleanModeToggle />
        <CleanModeSurface>
          <div data-testid="scene">Scene</div>
        </CleanModeSurface>
      </>
    );

    fireEvent.pointerDown(screen.getByTestId('scene'));
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(useUiStore.getState().cleanMode).toBe(true);
  });

  test('long-pressing a link does not toggle clean mode', () => {
    render(
      <>
        <CleanModeToggle />
        <CleanModeSurface>
          <a href="https://open.spotify.com/track/mock">Listen on Spotify</a>
        </CleanModeSurface>
      </>
    );

    fireEvent.pointerDown(screen.getByRole('link', { name: /listen on spotify/i }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(useUiStore.getState().cleanMode).toBe(false);
  });
});
