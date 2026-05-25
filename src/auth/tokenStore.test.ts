import { beforeEach, describe, expect, test } from 'vitest';
import { tokenStore } from './tokenStore';

describe('tokenStore', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test('returns null when no tokens set', () => {
    expect(tokenStore.get()).toBeNull();
  });

  test('round-trips tokens through sessionStorage', () => {
    tokenStore.set({ accessToken: 'a', refreshToken: 'r', expiresAt: 123 });
    expect(tokenStore.get()).toEqual({ accessToken: 'a', refreshToken: 'r', expiresAt: 123 });
  });

  test('clear removes tokens', () => {
    tokenStore.set({ accessToken: 'a', refreshToken: 'r', expiresAt: 123 });
    tokenStore.clear();
    expect(tokenStore.get()).toBeNull();
  });

  test('subscribers notified on set and clear', () => {
    const events: (null | string)[] = [];
    const unsub = tokenStore.subscribe(tokens => events.push(tokens?.accessToken ?? null));
    tokenStore.set({ accessToken: 'a', refreshToken: 'r', expiresAt: 1 });
    tokenStore.clear();
    unsub();
    expect(events).toEqual(['a', null]);
  });
});
