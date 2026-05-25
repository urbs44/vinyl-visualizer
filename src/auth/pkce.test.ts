import { describe, expect, test } from 'vitest';
import { generateCodeChallenge, generateCodeVerifier, generateState } from './pkce';

describe('pkce', () => {
  test('generateCodeVerifier returns a 43-128 char URL-safe string', () => {
    const verifier = generateCodeVerifier();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  test('two verifiers are different', () => {
    expect(generateCodeVerifier()).not.toBe(generateCodeVerifier());
  });

  test('generateCodeChallenge produces a base64url SHA-256 of verifier', async () => {
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const challenge = await generateCodeChallenge(verifier);
    expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });

  test('generateState returns a 32+ char URL-safe string', () => {
    const state = generateState();
    expect(state.length).toBeGreaterThanOrEqual(32);
    expect(state).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
