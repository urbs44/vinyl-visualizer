import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { isMockMode } from '../env';
import { createTabLeader } from '../lib/tabLeader';
import { TRACK_FIXTURE } from '../mocks/fixtures';
import type { PlaybackSnapshot } from '../playback/types';
import { RateLimitError } from './client';
import { fetchNowPlaying } from './nowPlaying';
import { normalize } from './normalize';

const QUERY_KEY = ['nowPlaying'] as const;

export function usePlayback() {
  const queryClient = useQueryClient();
  const mock = isMockMode();
  const leader = useMemo(() => createTabLeader('vv.playback'), []);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);

  useEffect(() => {
    if (mock) return;
    leader.start();
    const unsubscribe = leader.onMessage(message => {
      if ((message as { __type?: string })?.__type === 'snapshot') {
        queryClient.setQueryData(QUERY_KEY, (message as { data: PlaybackSnapshot }).data);
      }
    });
    return () => {
      unsubscribe();
      leader.stop();
    };
  }, [leader, queryClient, mock]);

  useEffect(() => {
    if (!rateLimitedUntil) return;

    const remainingMs = Math.max(rateLimitedUntil - Date.now(), 0);
    const timer = setTimeout(() => {
      setRateLimitedUntil(null);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }, remainingMs);

    return () => {
      clearTimeout(timer);
    };
  }, [queryClient, rateLimitedUntil]);

  const query = useQuery<PlaybackSnapshot>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      if (mock) return normalize(TRACK_FIXTURE);
      if (!leader.isLeader()) {
        return queryClient.getQueryData<PlaybackSnapshot>(QUERY_KEY) ?? { kind: 'idle' };
      }
      try {
        const raw = await fetchNowPlaying();
        const snapshot = normalize(raw);
        setRateLimitedUntil(null);
        leader.broadcast({ __type: 'snapshot', data: snapshot });
        return snapshot;
      } catch (error) {
        if (error instanceof RateLimitError) {
          setRateLimitedUntil(Date.now() + Math.max(error.retryAfter, 1) * 1000);
        }
        throw error;
      }
    },
    enabled: mock || rateLimitedUntil === null,
    refetchInterval: mock || rateLimitedUntil !== null ? false : 3000,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });

  return { snapshot: query.data ?? { kind: 'idle' as const }, error: query.error };
}
