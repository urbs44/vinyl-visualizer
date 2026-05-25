import { describe, expect, test, vi } from 'vitest';
import { createTabLeader } from './tabLeader';

describe('tabLeader', () => {
  test('first tab becomes leader after election timeout', async () => {
    vi.useFakeTimers();
    const leader = createTabLeader('test-channel');
    const onChange = vi.fn();
    leader.subscribe(onChange);
    leader.start();
    vi.advanceTimersByTime(650);
    expect(leader.isLeader()).toBe(true);
    expect(onChange).toHaveBeenCalledWith(true);
    leader.stop();
    vi.useRealTimers();
  });
});
