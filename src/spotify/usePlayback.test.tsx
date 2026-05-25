import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { RateLimitError } from './client';
import { usePlayback } from './usePlayback';

const mocks = vi.hoisted(() => ({
  fetchNowPlaying: vi.fn(),
  leader: {
    isLeader: vi.fn(() => true),
    start: vi.fn(),
    stop: vi.fn(),
    onMessage: vi.fn(() => () => undefined),
    broadcast: vi.fn(),
  },
}));

vi.mock('./nowPlaying', () => ({
  fetchNowPlaying: mocks.fetchNowPlaying,
}));

vi.mock('../env', () => ({
  isMockMode: () => false,
}));

vi.mock('../lib/tabLeader', () => ({
  createTabLeader: () => mocks.leader,
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('usePlayback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    vi.clearAllMocks();
    mocks.leader.isLeader.mockReturnValue(true);
    mocks.leader.onMessage.mockReturnValue(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('pauses polling until Retry-After elapses after a Spotify 429', async () => {
    mocks.fetchNowPlaying
      .mockRejectedValueOnce(new RateLimitError(7))
      .mockResolvedValueOnce(null);

    renderHook(() => usePlayback(), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(mocks.fetchNowPlaying).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(mocks.fetchNowPlaying).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });
    expect(mocks.fetchNowPlaying).toHaveBeenCalledTimes(2);
  });
});
