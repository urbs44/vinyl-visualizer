import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
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
        leader.broadcast({ __type: 'snapshot', data: snapshot });
        return snapshot;
      } catch (error) {
        if (error instanceof RateLimitError) throw error;
        throw error;
      }
    },
    refetchInterval: mock ? false : 3000,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });

  return { snapshot: query.data ?? { kind: 'idle' as const }, error: query.error };
}
