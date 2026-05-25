# VinylVision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal-use web app that mirrors Spotify playback as an animated record player scene (abstract spinning vinyl + unmodified album sleeve card + tonearm + Vintage Oak skin + clean display mode), deployable to Vercel and usable on iPad and TV.

**Architecture:** React 18 + Vite + TypeScript SPA. PKCE OAuth in browser (no backend). TanStack Query polls Spotify `/me/player/currently-playing` every 3s; BroadcastChannel elects a leader tab. Zustand holds only UI preferences. Canvas 2D renders the abstract vinyl; SVG renders the tonearm; CSS renders cabinet/wall. Web Animations API drives spin with playbackRate ease. Album artwork is always displayed unmodified as a square sleeve card; the vinyl label is palette-derived only. Deployed to Vercel with custom domain and CSP headers.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, Zustand, TanStack Query, MSW, Vitest, Playwright, `node-vibrant` (palette extraction), Vercel.

---

## File Structure

```
vinyl-visualizer/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── vercel.json
├── index.html
├── public/
│   ├── manifest.webmanifest
│   └── icons/ (192, 512, maskable)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── env.ts                          # VITE_SPOTIFY_CLIENT_ID, redirect URI helpers
│   ├── auth/
│   │   ├── pkce.ts
│   │   ├── pkce.test.ts
│   │   ├── tokenStore.ts
│   │   ├── tokenStore.test.ts
│   │   ├── spotifyAuth.ts
│   │   ├── spotifyAuth.test.ts
│   │   └── useAuth.ts
│   ├── spotify/
│   │   ├── client.ts
│   │   ├── client.test.ts
│   │   ├── nowPlaying.ts
│   │   ├── normalize.ts
│   │   ├── normalize.test.ts
│   │   └── usePlayback.ts
│   ├── playback/
│   │   ├── types.ts
│   │   ├── deriveTurntableState.ts
│   │   └── deriveTurntableState.test.ts
│   ├── lib/
│   │   ├── tabLeader.ts
│   │   └── tabLeader.test.ts
│   ├── palette/
│   │   ├── extractPalette.ts
│   │   └── extractPalette.test.ts
│   ├── skins/
│   │   ├── types.ts
│   │   ├── skins.ts
│   │   └── useSkin.ts
│   ├── store/
│   │   └── uiStore.ts
│   ├── scene/
│   │   ├── Scene.tsx
│   │   ├── Cabinet.tsx
│   │   ├── Turntable.tsx
│   │   ├── Vinyl.tsx
│   │   ├── Tonearm.tsx
│   │   └── SleeveCard.tsx
│   ├── ui/
│   │   ├── LoginScreen.tsx
│   │   ├── CallbackRoute.tsx
│   │   ├── TrackInfo.tsx
│   │   ├── CleanModeToggle.tsx
│   │   └── SpotifyAttribution.tsx
│   ├── mocks/
│   │   ├── fixtures.ts                 # Mock playback responses
│   │   └── handlers.ts                 # MSW handlers
│   └── styles/
│       └── globals.css
├── tests/
│   ├── e2e/
│   │   ├── auth.spec.ts
│   │   ├── playback.spec.ts
│   │   └── visual.spec.ts
│   └── fixtures/
│       └── artwork/ (sample images)
└── docs/                               # already exists
```

---

## Phase 0: Project Foundation

### Task 1: Scaffold Vite + React + TypeScript

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`

- [ ] **Step 1: Initialize Vite project**

Run from `/Users/matthewurbano/Projects/music-visualizer`:
```bash
npm create vite@latest . -- --template react-ts
```
When prompted "Current directory is not empty", select "Ignore files and continue".

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

- [ ] **Step 3: Verify dev server starts**

```bash
npm run dev
```
Expected: Vite logs `Local: http://localhost:5173/`. Stop with Ctrl+C.

- [ ] **Step 4: Pin Vite dev server to port 5173 and host 127.0.0.1**

Replace `vite.config.ts` with:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
});
```

- [ ] **Step 5: Verify host binding**

```bash
npm run dev
```
Expected: log shows `Local: http://127.0.0.1:5173/`. Stop with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TypeScript"
```

---

### Task 2: Install Tailwind CSS

**Files:**
- Create: `tailwind.config.ts`, `postcss.config.js`, `src/styles/globals.css`
- Modify: `src/main.tsx`

- [ ] **Step 1: Install Tailwind**

```bash
npm install -D tailwindcss@^3 postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 2: Rename tailwind config to .ts and configure content**

Delete `tailwind.config.js`. Create `tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 3: Create globals.css**

Create `src/styles/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  height: 100%;
  margin: 0;
  background: #000;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow: hidden;
}
```

- [ ] **Step 4: Import globals.css from main.tsx**

Replace `src/main.tsx` with:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 5: Replace App.tsx with placeholder**

Replace `src/App.tsx` with:
```tsx
export default function App() {
  return (
    <div className="h-full flex items-center justify-center text-white">
      <h1 className="text-2xl">VinylVision</h1>
    </div>
  );
}
```

Delete `src/App.css` if present.

- [ ] **Step 6: Verify Tailwind renders**

```bash
npm run dev
```
Open `http://127.0.0.1:5173` — should show centered white "VinylVision" on black. Stop server.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: add Tailwind CSS"
```

---

### Task 3: Install runtime dependencies

**Files:** Modify: `package.json` (via npm)

- [ ] **Step 1: Install runtime deps**

```bash
npm install zustand @tanstack/react-query node-vibrant
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add zustand, tanstack-query, node-vibrant"
```

---

### Task 4: Set up Vitest

**Files:**
- Create: `vitest.config.ts`, `src/test/setup.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Vitest + RTL + jsdom + MSW**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitest/ui msw
```

- [ ] **Step 2: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

- [ ] **Step 3: Create test setup file**

Create `src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Add test scripts to package.json**

In `package.json`, replace the `scripts` block (keep existing entries; add/replace these):
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 5: Write a smoke test**

Create `src/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app title', () => {
  render(<App />);
  expect(screen.getByText('VinylVision')).toBeInTheDocument();
});
```

- [ ] **Step 6: Run test**

```bash
npm test
```
Expected: 1 passed.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: set up Vitest + RTL"
```

---

### Task 5: Set up Playwright

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/.gitkeep`
- Modify: `package.json`

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium webkit
```

- [ ] **Step 2: Create playwright.config.ts**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'ipad-webkit', use: { ...devices['iPad (gen 7) landscape'] } },
  ],
});
```

- [ ] **Step 3: Add a placeholder e2e test**

Create `tests/e2e/smoke.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('VinylVision')).toBeVisible();
});
```

- [ ] **Step 4: Run Playwright**

```bash
npm run test:e2e
```
Expected: 2 passed (one per project).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: set up Playwright"
```

---

### Task 6: Vercel + env config

**Files:**
- Create: `vercel.json`, `.env.example`, `src/env.ts`

- [ ] **Step 1: Create vercel.json with SPA fallback + CSP headers**

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://i.scdn.co https://image-cdn-ak.spotifycdn.com https://image-cdn-fa.spotifycdn.com https://mosaic.scdn.co; connect-src 'self' https://accounts.spotify.com https://api.spotify.com; frame-ancestors 'none'; base-uri 'self'"
        },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

- [ ] **Step 2: Create .env.example**

```
VITE_SPOTIFY_CLIENT_ID=e9fceabcee074982bb372ca66e7f0b0c
```

- [ ] **Step 3: Create .env (local, gitignored)**

```bash
cp .env.example .env
```

- [ ] **Step 4: Create src/env.ts**

```ts
export const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string;

if (!SPOTIFY_CLIENT_ID) {
  throw new Error('VITE_SPOTIFY_CLIENT_ID is not set. Copy .env.example to .env.');
}

export function getRedirectUri(): string {
  return `${window.location.origin}/callback`;
}

export function isMockMode(): boolean {
  return new URLSearchParams(window.location.search).get('mock') === '1';
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: add Vercel config, env, CSP headers"
```

---

## Phase 1: Authentication

### Task 7: PKCE helpers

**Files:**
- Create: `src/auth/pkce.ts`, `src/auth/pkce.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/auth/pkce.test.ts`:
```ts
import { describe, test, expect } from 'vitest';
import { generateCodeVerifier, generateCodeChallenge, generateState } from './pkce';

describe('pkce', () => {
  test('generateCodeVerifier returns a 43-128 char URL-safe string', () => {
    const v = generateCodeVerifier();
    expect(v.length).toBeGreaterThanOrEqual(43);
    expect(v.length).toBeLessThanOrEqual(128);
    expect(v).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  test('two verifiers are different', () => {
    expect(generateCodeVerifier()).not.toBe(generateCodeVerifier());
  });

  test('generateCodeChallenge produces a base64url SHA-256 of verifier', async () => {
    const v = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const c = await generateCodeChallenge(v);
    expect(c).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });

  test('generateState returns a 32+ char URL-safe string', () => {
    const s = generateState();
    expect(s.length).toBeGreaterThanOrEqual(32);
    expect(s).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
```

- [ ] **Step 2: Run test, verify fails**

```bash
npm test src/auth/pkce.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement pkce.ts**

Create `src/auth/pkce.ts`:
```ts
function base64UrlEncode(bytes: Uint8Array): string {
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomUrlSafe(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export function generateCodeVerifier(): string {
  return randomUrlSafe(64); // ~86 chars after base64url
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

export function generateState(): string {
  return randomUrlSafe(24); // ~32 chars
}
```

- [ ] **Step 4: Run test, verify passes**

```bash
npm test src/auth/pkce.test.ts
```
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(auth): PKCE verifier/challenge/state helpers"
```

---

### Task 8: Token store

**Files:**
- Create: `src/auth/tokenStore.ts`, `src/auth/tokenStore.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/auth/tokenStore.test.ts`:
```ts
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
    const unsub = tokenStore.subscribe(t => events.push(t?.accessToken ?? null));
    tokenStore.set({ accessToken: 'a', refreshToken: 'r', expiresAt: 1 });
    tokenStore.clear();
    unsub();
    expect(events).toEqual(['a', null]);
  });
});
```

- [ ] **Step 2: Run test, verify fails**

```bash
npm test src/auth/tokenStore.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement tokenStore.ts**

```ts
export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
}

const KEY = 'vv.tokens';
type Listener = (tokens: Tokens | null) => void;
const listeners = new Set<Listener>();

function notify(tokens: Tokens | null) {
  for (const l of listeners) l(tokens);
}

export const tokenStore = {
  get(): Tokens | null {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Tokens;
    } catch {
      return null;
    }
  },
  set(tokens: Tokens): void {
    sessionStorage.setItem(KEY, JSON.stringify(tokens));
    notify(tokens);
  },
  clear(): void {
    sessionStorage.removeItem(KEY);
    notify(null);
  },
  subscribe(l: Listener): () => void {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};
```

- [ ] **Step 4: Run test, verify passes**

```bash
npm test src/auth/tokenStore.test.ts
```
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(auth): isolated token store"
```

---

### Task 9: Spotify auth flow

**Files:**
- Create: `src/auth/spotifyAuth.ts`, `src/auth/spotifyAuth.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/auth/spotifyAuth.test.ts`:
```ts
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { buildAuthorizeUrl, handleCallback, refreshAccessToken } from './spotifyAuth';
import { tokenStore } from './tokenStore';

vi.mock('./pkce', () => ({
  generateCodeVerifier: () => 'verifier-xyz',
  generateCodeChallenge: async () => 'challenge-xyz',
  generateState: () => 'state-xyz',
}));

const ORIGINAL_FETCH = global.fetch;

describe('spotifyAuth', () => {
  beforeEach(() => {
    sessionStorage.clear();
    global.fetch = vi.fn() as any;
  });

  test('buildAuthorizeUrl stores verifier+state and returns spotify URL with correct params', async () => {
    const url = await buildAuthorizeUrl('CID', 'http://127.0.0.1:5173/callback');
    const u = new URL(url);
    expect(u.origin + u.pathname).toBe('https://accounts.spotify.com/authorize');
    expect(u.searchParams.get('client_id')).toBe('CID');
    expect(u.searchParams.get('response_type')).toBe('code');
    expect(u.searchParams.get('redirect_uri')).toBe('http://127.0.0.1:5173/callback');
    expect(u.searchParams.get('code_challenge_method')).toBe('S256');
    expect(u.searchParams.get('code_challenge')).toBe('challenge-xyz');
    expect(u.searchParams.get('state')).toBe('state-xyz');
    expect(u.searchParams.get('scope')).toBe('user-read-currently-playing');
    expect(sessionStorage.getItem('vv.pkce.verifier')).toBe('verifier-xyz');
    expect(sessionStorage.getItem('vv.pkce.state')).toBe('state-xyz');
  });

  test('handleCallback rejects on state mismatch', async () => {
    sessionStorage.setItem('vv.pkce.verifier', 'v');
    sessionStorage.setItem('vv.pkce.state', 'expected');
    await expect(handleCallback('CID', 'http://127.0.0.1:5173/callback', 'code', 'wrong-state')).rejects.toThrow(/state/i);
  });

  test('handleCallback exchanges code and stores tokens', async () => {
    sessionStorage.setItem('vv.pkce.verifier', 'verifier-xyz');
    sessionStorage.setItem('vv.pkce.state', 'state-xyz');
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'A', refresh_token: 'R', expires_in: 3600 }),
    });
    await handleCallback('CID', 'http://127.0.0.1:5173/callback', 'code', 'state-xyz');
    const t = tokenStore.get();
    expect(t?.accessToken).toBe('A');
    expect(t?.refreshToken).toBe('R');
    expect(t?.expiresAt).toBeGreaterThan(Date.now());
    expect(sessionStorage.getItem('vv.pkce.verifier')).toBeNull();
    expect(sessionStorage.getItem('vv.pkce.state')).toBeNull();
  });

  test('refreshAccessToken updates access token and keeps existing refresh if absent', async () => {
    tokenStore.set({ accessToken: 'old', refreshToken: 'R', expiresAt: 0 });
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'NEW', expires_in: 3600 }),
    });
    await refreshAccessToken('CID');
    const t = tokenStore.get();
    expect(t?.accessToken).toBe('NEW');
    expect(t?.refreshToken).toBe('R');
  });

  test('refreshAccessToken replaces refresh token if response includes one', async () => {
    tokenStore.set({ accessToken: 'old', refreshToken: 'R', expiresAt: 0 });
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'NEW', refresh_token: 'NEWR', expires_in: 3600 }),
    });
    await refreshAccessToken('CID');
    expect(tokenStore.get()?.refreshToken).toBe('NEWR');
  });

  afterAll(() => {
    global.fetch = ORIGINAL_FETCH;
  });
});
```

- [ ] **Step 2: Run test, verify fails**

```bash
npm test src/auth/spotifyAuth.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement spotifyAuth.ts**

```ts
import { generateCodeChallenge, generateCodeVerifier, generateState } from './pkce';
import { tokenStore } from './tokenStore';

const AUTHORIZE_URL = 'https://accounts.spotify.com/authorize';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SCOPE = 'user-read-currently-playing';

const KEY_VERIFIER = 'vv.pkce.verifier';
const KEY_STATE = 'vv.pkce.state';

export async function buildAuthorizeUrl(clientId: string, redirectUri: string): Promise<string> {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = generateState();
  sessionStorage.setItem(KEY_VERIFIER, verifier);
  sessionStorage.setItem(KEY_STATE, state);
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
    scope: SCOPE,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export async function handleCallback(
  clientId: string,
  redirectUri: string,
  code: string,
  returnedState: string
): Promise<void> {
  const expectedState = sessionStorage.getItem(KEY_STATE);
  const verifier = sessionStorage.getItem(KEY_VERIFIER);
  if (!expectedState || expectedState !== returnedState) {
    sessionStorage.removeItem(KEY_VERIFIER);
    sessionStorage.removeItem(KEY_STATE);
    throw new Error('OAuth state mismatch — possible CSRF, aborting.');
  }
  if (!verifier) throw new Error('Missing PKCE verifier');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: verifier,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const data = await res.json();
  tokenStore.set({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  });
  sessionStorage.removeItem(KEY_VERIFIER);
  sessionStorage.removeItem(KEY_STATE);
}

let refreshInFlight: Promise<void> | null = null;

export function refreshAccessToken(clientId: string): Promise<void> {
  if (refreshInFlight) return refreshInFlight;
  const current = tokenStore.get();
  if (!current) return Promise.reject(new Error('No tokens to refresh'));

  refreshInFlight = (async () => {
    try {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: current.refreshToken,
        client_id: clientId,
      });
      const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) {
        tokenStore.clear();
        throw new Error(`Refresh failed: ${res.status}`);
      }
      const data = await res.json();
      tokenStore.set({
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? current.refreshToken,
        expiresAt: Date.now() + data.expires_in * 1000,
      });
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export function logout(): void {
  tokenStore.clear();
  sessionStorage.removeItem(KEY_VERIFIER);
  sessionStorage.removeItem(KEY_STATE);
}
```

- [ ] **Step 4: Run test, verify passes**

```bash
npm test src/auth/spotifyAuth.test.ts
```
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(auth): Spotify PKCE flow + refresh"
```

---

### Task 10: useAuth hook

**Files:**
- Create: `src/auth/useAuth.ts`

- [ ] **Step 1: Implement useAuth**

```ts
import { useEffect, useState } from 'react';
import { tokenStore, type Tokens } from './tokenStore';
import { buildAuthorizeUrl, logout as doLogout } from './spotifyAuth';
import { SPOTIFY_CLIENT_ID, getRedirectUri } from '../env';

export function useAuth() {
  const [tokens, setTokens] = useState<Tokens | null>(() => tokenStore.get());

  useEffect(() => {
    const unsub = tokenStore.subscribe(setTokens);
    return () => {
      unsub();
    };
  }, []);

  return {
    isAuthed: !!tokens,
    async login() {
      const url = await buildAuthorizeUrl(SPOTIFY_CLIENT_ID, getRedirectUri());
      window.location.assign(url);
    },
    logout() {
      doLogout();
    },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(auth): useAuth hook"
```

---

### Task 11: Login screen + Callback route

**Files:**
- Create: `src/ui/LoginScreen.tsx`, `src/ui/CallbackRoute.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create LoginScreen**

Create `src/ui/LoginScreen.tsx`:
```tsx
import { useAuth } from '../auth/useAuth';

export function LoginScreen() {
  const { login } = useAuth();
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 bg-black text-white">
      <h1 className="text-4xl font-light tracking-wide">VinylVision</h1>
      <p className="text-white/60 text-sm">Your Spotify, as a record player.</p>
      <button
        onClick={() => login()}
        className="px-6 py-3 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold"
      >
        Connect Spotify
      </button>
      <p className="text-white/40 text-xs max-w-sm text-center">
        Requires a Spotify Premium account authorized for this app (Development Mode).
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create CallbackRoute**

Create `src/ui/CallbackRoute.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { handleCallback } from '../auth/spotifyAuth';
import { SPOTIFY_CLIENT_ID, getRedirectUri } from '../env';

export function CallbackRoute() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const denied = params.get('error');

    if (denied) {
      setError('Spotify access denied. Returning to login...');
      setTimeout(() => (window.location.href = '/'), 1500);
      return;
    }
    if (!code || !state) {
      setError('Missing code/state. Returning to login...');
      setTimeout(() => (window.location.href = '/'), 1500);
      return;
    }
    handleCallback(SPOTIFY_CLIENT_ID, getRedirectUri(), code, state)
      .then(() => {
        // Strip ?code=&state= from URL
        window.history.replaceState({}, '', '/');
        window.location.reload();
      })
      .catch(err => {
        setError(err.message);
      });
  }, []);

  return (
    <div className="h-full flex items-center justify-center bg-black text-white">
      {error ? <p className="text-red-400">{error}</p> : <p>Connecting...</p>}
    </div>
  );
}
```

- [ ] **Step 3: Wire routing in App.tsx**

Replace `src/App.tsx`:
```tsx
import { LoginScreen } from './ui/LoginScreen';
import { CallbackRoute } from './ui/CallbackRoute';
import { useAuth } from './auth/useAuth';

export default function App() {
  const { isAuthed } = useAuth();

  if (window.location.pathname === '/callback') {
    return <CallbackRoute />;
  }
  if (!isAuthed) {
    return <LoginScreen />;
  }
  return (
    <div className="h-full flex items-center justify-center text-white">
      <p>Authenticated — scene goes here.</p>
    </div>
  );
}
```

- [ ] **Step 4: Update App.test.tsx**

Replace `src/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login when unauthenticated', () => {
  render(<App />);
  expect(screen.getByText('VinylVision')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /connect spotify/i })).toBeInTheDocument();
});
```

- [ ] **Step 5: Run tests**

```bash
npm test
```
Expected: all pass.

- [ ] **Step 6: Manual smoke**

```bash
npm run dev
```
Open `http://127.0.0.1:5173`. See "VinylVision" + "Connect Spotify" button. Click it → redirects to Spotify (will fail to come back until callback is registered, but the redirect itself proves the flow). Stop server.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(ui): login screen + callback route"
```

---

## Phase 2: Spotify Data Layer

### Task 12: Spotify API client

**Files:**
- Create: `src/spotify/client.ts`, `src/spotify/client.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/spotify/client.test.ts`:
```ts
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { spotifyFetch } from './client';
import { tokenStore } from '../auth/tokenStore';

vi.mock('../auth/spotifyAuth', () => ({
  refreshAccessToken: vi.fn(async () => {
    tokenStore.set({ accessToken: 'NEW', refreshToken: 'R', expiresAt: Date.now() + 3600_000 });
  }),
}));

vi.mock('../env', () => ({ SPOTIFY_CLIENT_ID: 'CID' }));

describe('spotifyFetch', () => {
  beforeEach(() => {
    sessionStorage.clear();
    tokenStore.set({ accessToken: 'OLD', refreshToken: 'R', expiresAt: Date.now() + 3600_000 });
    global.fetch = vi.fn() as any;
  });

  test('adds Authorization header and returns JSON', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ x: 1 }) });
    const data = await spotifyFetch('/me');
    expect(data).toEqual({ x: 1 });
    const headers = (global.fetch as any).mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer OLD');
  });

  test('204 returns null', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, status: 204, json: async () => null });
    expect(await spotifyFetch('/me/player/currently-playing')).toBeNull();
  });

  test('on 401 refreshes and retries once with new token', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true }) });
    const data = await spotifyFetch('/me');
    expect(data).toEqual({ ok: true });
    expect((global.fetch as any).mock.calls[1][1].headers.Authorization).toBe('Bearer NEW');
  });

  test('on 429 throws RateLimitError with retryAfter', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: new Headers({ 'Retry-After': '7' }),
      json: async () => ({}),
    });
    await expect(spotifyFetch('/me')).rejects.toMatchObject({ name: 'RateLimitError', retryAfter: 7 });
  });

  test('on 403 throws ForbiddenError', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({}) });
    await expect(spotifyFetch('/me')).rejects.toMatchObject({ name: 'ForbiddenError' });
  });
});
```

- [ ] **Step 2: Run, verify fails**

```bash
npm test src/spotify/client.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement client.ts**

```ts
import { tokenStore } from '../auth/tokenStore';
import { refreshAccessToken } from '../auth/spotifyAuth';
import { SPOTIFY_CLIENT_ID } from '../env';

const BASE = 'https://api.spotify.com/v1';

export class RateLimitError extends Error {
  name = 'RateLimitError';
  constructor(public retryAfter: number) {
    super(`Rate limited; retry after ${retryAfter}s`);
  }
}

export class ForbiddenError extends Error {
  name = 'ForbiddenError';
  constructor() {
    super('403 Forbidden — Spotify account not authorized for this app');
  }
}

export class UnauthorizedError extends Error {
  name = 'UnauthorizedError';
  constructor() {
    super('401 after refresh — please re-login');
  }
}

async function doFetch(path: string, accessToken: string): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function spotifyFetch<T = unknown>(path: string): Promise<T | null> {
  const tokens = tokenStore.get();
  if (!tokens) throw new UnauthorizedError();

  let res = await doFetch(path, tokens.accessToken);

  if (res.status === 401) {
    await refreshAccessToken(SPOTIFY_CLIENT_ID);
    const refreshed = tokenStore.get();
    if (!refreshed) throw new UnauthorizedError();
    res = await doFetch(path, refreshed.accessToken);
    if (res.status === 401) throw new UnauthorizedError();
  }

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers?.get?.('Retry-After') ?? '5', 10);
    throw new RateLimitError(retryAfter);
  }

  if (res.status === 403) throw new ForbiddenError();

  if (res.status === 204) return null;

  if (!res.ok) throw new Error(`Spotify API ${res.status}`);
  return (await res.json()) as T;
}
```

- [ ] **Step 4: Run, verify passes**

```bash
npm test src/spotify/client.test.ts
```
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(spotify): API client with refresh, 429, 403 handling"
```

---

### Task 13: Now-playing fetch + types

**Files:**
- Create: `src/spotify/nowPlaying.ts`, `src/playback/types.ts`

- [ ] **Step 1: Define playback types**

Create `src/playback/types.ts`:
```ts
export type PlaybackSnapshot =
  | { kind: 'idle' }
  | { kind: 'ad' }
  | {
      kind: 'track' | 'episode';
      uri: string | null;
      identityKey: string;
      title: string;
      subtitle: string; // artist (track) or show name (episode)
      albumName?: string;
      artworkUrl: string | null;
      externalUrl: string | null;
      isPlaying: boolean;
      progressMs: number;
      durationMs: number;
    };
```

- [ ] **Step 2: Implement nowPlaying.ts**

Create `src/spotify/nowPlaying.ts`:
```ts
import { spotifyFetch } from './client';

export interface SpotifyNowPlayingResponse {
  is_playing: boolean;
  progress_ms: number | null;
  currently_playing_type: 'track' | 'episode' | 'ad' | 'unknown';
  item: any | null;
}

export async function fetchNowPlaying(): Promise<SpotifyNowPlayingResponse | null> {
  return spotifyFetch<SpotifyNowPlayingResponse>(
    '/me/player/currently-playing?additional_types=track,episode'
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(spotify): now-playing fetch + playback types"
```

---

### Task 14: Normalize Spotify response

**Files:**
- Create: `src/spotify/normalize.ts`, `src/spotify/normalize.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/spotify/normalize.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { normalize } from './normalize';

describe('normalize', () => {
  test('null response → idle', () => {
    expect(normalize(null)).toEqual({ kind: 'idle' });
  });

  test('response with no item → idle', () => {
    expect(normalize({ is_playing: false, progress_ms: 0, currently_playing_type: 'unknown', item: null })).toEqual({ kind: 'idle' });
  });

  test('ad → ad', () => {
    expect(normalize({ is_playing: true, progress_ms: 0, currently_playing_type: 'ad', item: null })).toEqual({ kind: 'ad' });
  });

  test('track maps fields and uses uri as identityKey', () => {
    const r = normalize({
      is_playing: true,
      progress_ms: 1000,
      currently_playing_type: 'track',
      item: {
        uri: 'spotify:track:abc',
        name: 'Song',
        duration_ms: 240000,
        external_urls: { spotify: 'https://open.spotify.com/track/abc' },
        album: { name: 'Album', images: [{ url: 'https://i.scdn.co/img.jpg' }] },
        artists: [{ name: 'A' }, { name: 'B' }],
      },
    });
    expect(r).toMatchObject({
      kind: 'track',
      uri: 'spotify:track:abc',
      identityKey: 'spotify:track:abc',
      title: 'Song',
      subtitle: 'A, B',
      albumName: 'Album',
      artworkUrl: 'https://i.scdn.co/img.jpg',
      externalUrl: 'https://open.spotify.com/track/abc',
      isPlaying: true,
      progressMs: 1000,
      durationMs: 240000,
    });
  });

  test('track with null uri uses composite identityKey', () => {
    const r = normalize({
      is_playing: true,
      progress_ms: 0,
      currently_playing_type: 'track',
      item: {
        uri: null,
        name: 'Local Song',
        duration_ms: 100,
        external_urls: {},
        album: { name: 'Local Album', images: [] },
        artists: [{ name: 'Me' }],
      },
    });
    expect(r).toMatchObject({
      kind: 'track',
      uri: null,
      identityKey: 'local:Local Song|Me|Local Album',
      artworkUrl: null,
      externalUrl: null,
    });
  });

  test('episode maps show as subtitle', () => {
    const r = normalize({
      is_playing: true,
      progress_ms: 0,
      currently_playing_type: 'episode',
      item: {
        uri: 'spotify:episode:e',
        name: 'Ep',
        duration_ms: 1000,
        external_urls: { spotify: 'https://open.spotify.com/episode/e' },
        images: [{ url: 'https://i.scdn.co/ep.jpg' }],
        show: { name: 'The Show' },
      },
    });
    expect(r).toMatchObject({
      kind: 'episode',
      title: 'Ep',
      subtitle: 'The Show',
      artworkUrl: 'https://i.scdn.co/ep.jpg',
      albumName: undefined,
    });
  });

  test('unknown type → idle', () => {
    expect(normalize({ is_playing: false, progress_ms: 0, currently_playing_type: 'unknown', item: { foo: 1 } } as any)).toEqual({ kind: 'idle' });
  });
});
```

- [ ] **Step 2: Run, verify fails**

```bash
npm test src/spotify/normalize.test.ts
```

- [ ] **Step 3: Implement normalize.ts**

```ts
import type { PlaybackSnapshot } from '../playback/types';
import type { SpotifyNowPlayingResponse } from './nowPlaying';

export function normalize(res: SpotifyNowPlayingResponse | null): PlaybackSnapshot {
  if (!res) return { kind: 'idle' };
  if (res.currently_playing_type === 'ad') return { kind: 'ad' };
  if (!res.item) return { kind: 'idle' };

  if (res.currently_playing_type === 'track') {
    const item = res.item;
    const artists = (item.artists ?? []).map((a: any) => a.name).join(', ');
    const albumName = item.album?.name;
    const artworkUrl = item.album?.images?.[0]?.url ?? null;
    const uri = item.uri ?? null;
    const identityKey = uri ?? `local:${item.name}|${artists}|${albumName ?? ''}`;
    return {
      kind: 'track',
      uri,
      identityKey,
      title: item.name,
      subtitle: artists,
      albumName,
      artworkUrl,
      externalUrl: item.external_urls?.spotify ?? null,
      isPlaying: res.is_playing,
      progressMs: res.progress_ms ?? 0,
      durationMs: item.duration_ms ?? 0,
    };
  }

  if (res.currently_playing_type === 'episode') {
    const item = res.item;
    const artworkUrl = item.images?.[0]?.url ?? null;
    const uri = item.uri ?? null;
    const showName = item.show?.name ?? '';
    const identityKey = uri ?? `local:${item.name}|${showName}|`;
    return {
      kind: 'episode',
      uri,
      identityKey,
      title: item.name,
      subtitle: showName,
      artworkUrl,
      externalUrl: item.external_urls?.spotify ?? null,
      isPlaying: res.is_playing,
      progressMs: res.progress_ms ?? 0,
      durationMs: item.duration_ms ?? 0,
    };
  }

  return { kind: 'idle' };
}
```

- [ ] **Step 4: Run, verify passes**

```bash
npm test src/spotify/normalize.test.ts
```
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(spotify): normalize raw response to PlaybackSnapshot"
```

---

### Task 15: Derive turntable state

**Files:**
- Create: `src/playback/deriveTurntableState.ts`, `src/playback/deriveTurntableState.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, test } from 'vitest';
import { deriveTurntableState } from './deriveTurntableState';
import type { PlaybackSnapshot } from './types';

describe('deriveTurntableState', () => {
  test('idle snapshot → idle state', () => {
    const s = deriveTurntableState({ kind: 'idle' });
    expect(s).toEqual({ kind: 'idle', isPlaying: false, transitionKey: 'idle' });
  });

  test('ad snapshot → ad state', () => {
    const s = deriveTurntableState({ kind: 'ad' });
    expect(s).toEqual({ kind: 'ad', isPlaying: true, transitionKey: 'ad' });
  });

  test('track → track state with identityKey as transitionKey', () => {
    const snap: PlaybackSnapshot = {
      kind: 'track',
      uri: 'spotify:track:abc',
      identityKey: 'spotify:track:abc',
      title: 'T',
      subtitle: 'A',
      artworkUrl: 'u',
      externalUrl: 'e',
      isPlaying: true,
      progressMs: 0,
      durationMs: 100,
    };
    const s = deriveTurntableState(snap);
    expect(s).toMatchObject({
      kind: 'track',
      isPlaying: true,
      transitionKey: 'spotify:track:abc',
      title: 'T',
      subtitle: 'A',
      artworkUrl: 'u',
      externalUrl: 'e',
    });
  });
});
```

- [ ] **Step 2: Run, verify fails.**

- [ ] **Step 3: Implement.**

```ts
import type { PlaybackSnapshot } from './types';

export type TurntableState =
  | { kind: 'idle'; isPlaying: false; transitionKey: 'idle' }
  | { kind: 'ad'; isPlaying: true; transitionKey: 'ad' }
  | {
      kind: 'track' | 'episode';
      isPlaying: boolean;
      transitionKey: string;
      title: string;
      subtitle: string;
      albumName?: string;
      artworkUrl: string | null;
      externalUrl: string | null;
    };

export function deriveTurntableState(snap: PlaybackSnapshot): TurntableState {
  if (snap.kind === 'idle') return { kind: 'idle', isPlaying: false, transitionKey: 'idle' };
  if (snap.kind === 'ad') return { kind: 'ad', isPlaying: true, transitionKey: 'ad' };
  return {
    kind: snap.kind,
    isPlaying: snap.isPlaying,
    transitionKey: snap.identityKey,
    title: snap.title,
    subtitle: snap.subtitle,
    albumName: snap.albumName,
    artworkUrl: snap.artworkUrl,
    externalUrl: snap.externalUrl,
  };
}
```

- [ ] **Step 4: Run, verify passes (3 passed).**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(playback): deriveTurntableState"
```

---

### Task 16: Tab leader election

**Files:**
- Create: `src/lib/tabLeader.ts`, `src/lib/tabLeader.test.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, expect, test, vi } from 'vitest';
import { createTabLeader } from './tabLeader';

describe('tabLeader', () => {
  test('first tab becomes leader after election timeout', async () => {
    vi.useFakeTimers();
    const leader = createTabLeader('test-channel');
    const onChange = vi.fn();
    leader.subscribe(onChange);
    leader.start();
    vi.advanceTimersByTime(500);
    expect(leader.isLeader()).toBe(true);
    expect(onChange).toHaveBeenCalledWith(true);
    leader.stop();
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run, verify fails.**

- [ ] **Step 3: Implement tabLeader.ts**

```ts
type LeaderListener = (isLeader: boolean) => void;

export interface TabLeader {
  isLeader(): boolean;
  start(): void;
  stop(): void;
  subscribe(l: LeaderListener): () => void;
  broadcast(message: unknown): void;
  onMessage(handler: (message: unknown) => void): () => void;
}

export function createTabLeader(channelName: string): TabLeader {
  const id = Math.random().toString(36).slice(2);
  let leader = false;
  let bc: BroadcastChannel | null = null;
  const listeners = new Set<LeaderListener>();
  const messageHandlers = new Set<(message: unknown) => void>();
  let electionTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let lastHeartbeat = 0;

  function setLeader(v: boolean) {
    if (leader === v) return;
    leader = v;
    for (const l of listeners) l(v);
  }

  function elect() {
    if (electionTimer) clearTimeout(electionTimer);
    electionTimer = setTimeout(() => {
      // No heartbeat from other leader → become leader
      if (Date.now() - lastHeartbeat > 400) {
        setLeader(true);
        startHeartbeat();
      }
    }, 400 + Math.random() * 200);
  }

  function startHeartbeat() {
    if (heartbeat) return;
    heartbeat = setInterval(() => {
      bc?.postMessage({ __type: 'heartbeat', from: id });
    }, 250);
  }

  function stopHeartbeat() {
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
  }

  return {
    isLeader: () => leader,
    start() {
      if (bc) return;
      bc = new BroadcastChannel(channelName);
      bc.onmessage = ev => {
        const msg = ev.data;
        if (msg?.__type === 'heartbeat' && msg.from !== id) {
          lastHeartbeat = Date.now();
          if (leader && msg.from < id) {
            // Yield to lower-id tab
            setLeader(false);
            stopHeartbeat();
          }
        } else if (msg?.__type === 'leader-quit') {
          elect();
        } else {
          for (const h of messageHandlers) h(msg);
        }
      };
      elect();
    },
    stop() {
      if (!bc) return;
      if (leader) bc.postMessage({ __type: 'leader-quit' });
      bc.close();
      bc = null;
      stopHeartbeat();
      if (electionTimer) clearTimeout(electionTimer);
      setLeader(false);
    },
    subscribe(l) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    broadcast(message) {
      bc?.postMessage(message);
    },
    onMessage(handler) {
      messageHandlers.add(handler);
      return () => messageHandlers.delete(handler);
    },
  };
}
```

- [ ] **Step 4: Run, verify passes.**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(lib): tab leader via BroadcastChannel"
```

---

### Task 17: Mocks and fixtures

**Files:**
- Create: `src/mocks/fixtures.ts`, `src/mocks/handlers.ts`

- [ ] **Step 1: Create fixtures**

```ts
// src/mocks/fixtures.ts
import type { SpotifyNowPlayingResponse } from '../spotify/nowPlaying';

export const TRACK_FIXTURE: SpotifyNowPlayingResponse = {
  is_playing: true,
  progress_ms: 42_000,
  currently_playing_type: 'track',
  item: {
    uri: 'spotify:track:mock1',
    name: 'Mock Anthem',
    duration_ms: 215_000,
    external_urls: { spotify: 'https://open.spotify.com/track/mock1' },
    album: {
      name: 'Mock Album',
      images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273abcabcabcabcabcabcabcabcab' }],
    },
    artists: [{ name: 'Mock Artist' }],
  },
};

export const IDLE_FIXTURE: SpotifyNowPlayingResponse | null = null;

export const AD_FIXTURE: SpotifyNowPlayingResponse = {
  is_playing: true,
  progress_ms: 5_000,
  currently_playing_type: 'ad',
  item: null,
};
```

- [ ] **Step 2: Create MSW handlers (for tests only)**

```ts
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import { TRACK_FIXTURE } from './fixtures';

export const handlers = [
  http.get('https://api.spotify.com/v1/me/player/currently-playing', () =>
    HttpResponse.json(TRACK_FIXTURE)
  ),
];
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test: mock fixtures and MSW handlers"
```

---

### Task 18: usePlayback hook with mock mode

**Files:**
- Create: `src/spotify/usePlayback.ts`
- Modify: `src/main.tsx` (add QueryClientProvider)

- [ ] **Step 1: Wrap app in QueryClientProvider**

Replace `src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
```

- [ ] **Step 2: Implement usePlayback**

Create `src/spotify/usePlayback.ts`:
```ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { fetchNowPlaying } from './nowPlaying';
import { normalize } from './normalize';
import { TRACK_FIXTURE } from '../mocks/fixtures';
import { isMockMode } from '../env';
import { createTabLeader } from '../lib/tabLeader';
import type { PlaybackSnapshot } from '../playback/types';
import { RateLimitError } from './client';

const QUERY_KEY = ['nowPlaying'] as const;

export function usePlayback() {
  const queryClient = useQueryClient();
  const mock = isMockMode();

  const leader = useMemo(() => createTabLeader('vv.playback'), []);

  useEffect(() => {
    if (mock) return;
    leader.start();
    const unsub = leader.onMessage(msg => {
      if ((msg as any)?.__type === 'snapshot') {
        queryClient.setQueryData(QUERY_KEY, (msg as any).data);
      }
    });
    return () => {
      unsub();
      leader.stop();
    };
  }, [leader, queryClient, mock]);

  const query = useQuery<PlaybackSnapshot>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      if (mock) return normalize(TRACK_FIXTURE);
      if (!leader.isLeader()) {
        // Not the leader; return whatever's cached, or idle
        return (queryClient.getQueryData<PlaybackSnapshot>(QUERY_KEY)) ?? { kind: 'idle' };
      }
      try {
        const raw = await fetchNowPlaying();
        const snap = normalize(raw);
        leader.broadcast({ __type: 'snapshot', data: snap });
        return snap;
      } catch (err) {
        if (err instanceof RateLimitError) {
          // Throw so Query will retry after the interval; could also adjust interval here
          throw err;
        }
        throw err;
      }
    },
    refetchInterval: mock ? false : 3000,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });

  return { snapshot: query.data ?? { kind: 'idle' as const }, error: query.error };
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(spotify): usePlayback hook with mock mode + tab leader"
```

---

## Phase 3: Palette Extraction

### Task 19: Extract palette from artwork

**Files:**
- Create: `src/palette/extractPalette.ts`, `src/palette/extractPalette.test.ts`

- [ ] **Step 1: Write test (using fixture image)**

Add a 64×64 solid-red PNG at `tests/fixtures/artwork/red.png` (or generate via canvas in setup). For simplicity, use a data URL fixture:

Create `src/palette/extractPalette.test.ts`:
```ts
import { describe, expect, test, vi } from 'vitest';
import { extractPalette } from './extractPalette';

// node-vibrant is heavy + requires DOM Image; we mock it
vi.mock('node-vibrant/browser', () => ({
  Vibrant: {
    from: () => ({
      getPalette: async () => ({
        Vibrant: { hex: '#ff0000' },
        DarkVibrant: { hex: '#880000' },
        Muted: { hex: '#aa6666' },
      }),
    }),
  },
}));

describe('extractPalette', () => {
  test('returns palette with dominant/dark/muted colors', async () => {
    const p = await extractPalette('https://i.scdn.co/img.jpg');
    expect(p).toEqual({ dominant: '#ff0000', dark: '#880000', muted: '#aa6666' });
  });

  test('returns null on null url', async () => {
    expect(await extractPalette(null)).toBeNull();
  });
});
```

- [ ] **Step 2: Run, verify fails.**

- [ ] **Step 3: Implement extractPalette.ts**

```ts
import { Vibrant } from 'node-vibrant/browser';

export interface Palette {
  dominant: string;
  dark: string;
  muted: string;
}

export async function extractPalette(url: string | null): Promise<Palette | null> {
  if (!url) return null;
  try {
    const img = await loadImageAsBlobUrl(url);
    const palette = await Vibrant.from(img).getPalette();
    return {
      dominant: palette.Vibrant?.hex ?? '#888888',
      dark: palette.DarkVibrant?.hex ?? '#333333',
      muted: palette.Muted?.hex ?? '#cccccc',
    };
  } catch {
    return null;
  }
}

async function loadImageAsBlobUrl(url: string): Promise<string> {
  // First try direct (Spotify CDN sends CORS-friendly responses)
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(`${res.status}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    // Fall back to the URL directly with crossOrigin attribute
    return url;
  }
}
```

- [ ] **Step 4: Run, verify passes.**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(palette): extract palette via node-vibrant with blob fetch"
```

---

## Phase 4: Skin System + UI Store

### Task 20: Skin types + Vintage Oak

**Files:**
- Create: `src/skins/types.ts`, `src/skins/skins.ts`, `src/skins/useSkin.ts`

- [ ] **Step 1: Skin types**

```ts
// src/skins/types.ts
export interface Skin {
  id: string;
  name: string;
  wall: { background: string };
  cabinet: { fill: string; accent: string };
  platter: { color: string; matColor: string };
  tonearm: { color: string; headshell: string };
  label: { ringColor: string };
}
```

- [ ] **Step 2: Define Vintage Oak**

```ts
// src/skins/skins.ts
import type { Skin } from './types';

export const VINTAGE_OAK: Skin = {
  id: 'vintage-oak',
  name: 'Vintage Oak',
  wall: {
    background: 'radial-gradient(ellipse at center, #2a1f17 0%, #1a120c 60%, #0c0805 100%)',
  },
  cabinet: { fill: '#6b4423', accent: '#c9a875' },
  platter: { color: '#1a1a1a', matColor: '#e8d9b8' },
  tonearm: { color: '#b8860b', headshell: '#222222' },
  label: { ringColor: '#f4e4bc' },
};

export const SKINS: Record<string, Skin> = {
  'vintage-oak': VINTAGE_OAK,
};

export const DEFAULT_SKIN_ID = 'vintage-oak';
```

- [ ] **Step 3: useSkin hook (reads from uiStore — created next)**

For now, a simple version:
```ts
// src/skins/useSkin.ts
import { SKINS, DEFAULT_SKIN_ID } from './skins';
import type { Skin } from './types';
import { useUiStore } from '../store/uiStore';

export function useSkin(): Skin {
  const skinId = useUiStore(s => s.skinId);
  return SKINS[skinId] ?? SKINS[DEFAULT_SKIN_ID];
}
```

This file won't compile until Task 21 lands `uiStore`. That's fine — commit after Task 21.

---

### Task 21: UI store (Zustand) + clean mode toggle

**Files:**
- Create: `src/store/uiStore.ts`, `src/ui/CleanModeToggle.tsx`

- [ ] **Step 1: uiStore.ts**

```ts
import { create } from 'zustand';
import { DEFAULT_SKIN_ID } from '../skins/skins';

interface UiState {
  skinId: string;
  cleanMode: boolean;
  setSkin: (id: string) => void;
  toggleCleanMode: () => void;
}

const SKIN_KEY = 'vv.skin';
const CLEAN_KEY = 'vv.cleanMode';

export const useUiStore = create<UiState>(set => ({
  skinId: localStorage.getItem(SKIN_KEY) ?? DEFAULT_SKIN_ID,
  cleanMode: localStorage.getItem(CLEAN_KEY) === '1',
  setSkin: id => {
    localStorage.setItem(SKIN_KEY, id);
    set({ skinId: id });
  },
  toggleCleanMode: () =>
    set(s => {
      const next = !s.cleanMode;
      localStorage.setItem(CLEAN_KEY, next ? '1' : '0');
      return { cleanMode: next };
    }),
}));
```

- [ ] **Step 2: CleanModeToggle (F key + tap-and-hold)**

```tsx
// src/ui/CleanModeToggle.tsx
import { useEffect } from 'react';
import { useUiStore } from '../store/uiStore';

export function CleanModeToggle() {
  const toggleCleanMode = useUiStore(s => s.toggleCleanMode);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'f') toggleCleanMode();
    }
    window.addEventListener('keydown', onKey);

    let pressTimer: ReturnType<typeof setTimeout> | null = null;
    function onPointerDown() {
      pressTimer = setTimeout(() => toggleCleanMode(), 1000);
    }
    function cancelPress() {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    }
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', cancelPress);
    window.addEventListener('pointercancel', cancelPress);
    window.addEventListener('pointerleave', cancelPress);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', cancelPress);
      window.removeEventListener('pointercancel', cancelPress);
      window.removeEventListener('pointerleave', cancelPress);
    };
  }, [toggleCleanMode]);

  return null;
}
```

- [ ] **Step 3: Commit Task 20 + 21 together**

```bash
git add -A
git commit -m "feat(skins,ui): skin system + ui store + clean mode toggle"
```

---

## Phase 5: Scene Rendering

### Task 22: Spotify attribution component

**Files:**
- Create: `src/ui/SpotifyAttribution.tsx`

- [ ] **Step 1: Implement**

```tsx
// Persistent — visible even in clean mode per Spotify policy.
interface Props {
  externalUrl: string | null;
}

export function SpotifyAttribution({ externalUrl }: Props) {
  const content = (
    <span className="inline-flex items-center gap-2 text-xs text-white/70 hover:text-white/100">
      <span className="font-semibold">Listen on Spotify</span>
    </span>
  );
  if (!externalUrl) {
    return <div className="fixed bottom-3 right-3 z-50 opacity-80">{content}</div>;
  }
  return (
    <a
      href={externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-3 right-3 z-50"
    >
      {content}
    </a>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(ui): persistent Spotify attribution"
```

---

### Task 23: SleeveCard (unmodified square artwork)

**Files:**
- Create: `src/scene/SleeveCard.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useSkin } from '../skins/useSkin';
import type { TurntableState } from '../playback/deriveTurntableState';

interface Props {
  state: TurntableState;
}

export function SleeveCard({ state }: Props) {
  const skin = useSkin();
  if (state.kind === 'idle' || state.kind === 'ad') return null;

  return (
    <div className="flex flex-col items-start gap-3 max-w-[300px]">
      <div
        className="w-[260px] h-[260px] flex items-center justify-center rounded-sm shadow-2xl"
        style={{ backgroundColor: skin.cabinet.fill }}
      >
        {state.artworkUrl ? (
          <img
            src={state.artworkUrl}
            alt={`${state.title} — ${state.subtitle}`}
            crossOrigin="anonymous"
            className="w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="text-white/40 text-xs">No artwork</div>
        )}
      </div>
      <div className="text-white">
        <div className="font-semibold leading-tight">{state.title}</div>
        <div className="text-sm text-white/70">{state.subtitle}</div>
        {state.albumName && (
          <div className="text-xs text-white/50 italic">{state.albumName}</div>
        )}
      </div>
      {state.externalUrl && (
        <a
          href={state.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#1DB954] hover:underline"
        >
          Listen on Spotify →
        </a>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(scene): SleeveCard with unmodified artwork"
```

---

### Task 24: Vinyl canvas

**Files:**
- Create: `src/scene/Vinyl.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useEffect, useRef, useState } from 'react';
import { useSkin } from '../skins/useSkin';
import { extractPalette, type Palette } from '../palette/extractPalette';
import type { TurntableState } from '../playback/deriveTurntableState';

interface Props {
  state: TurntableState;
  size?: number;
}

const RPM = 100 / 3; // 33.33 RPM
const SPIN_DURATION_MS = 60_000 / RPM; // 1800ms per revolution

export function Vinyl({ state, size = 420 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<Animation | null>(null);
  const skin = useSkin();
  const [palette, setPalette] = useState<Palette | null>(null);

  const artworkUrl = state.kind === 'track' || state.kind === 'episode' ? state.artworkUrl : null;

  // Extract palette on artwork change
  useEffect(() => {
    let cancelled = false;
    extractPalette(artworkUrl).then(p => {
      if (!cancelled) setPalette(p);
    });
    return () => {
      cancelled = true;
    };
  }, [artworkUrl]);

  // Redraw vinyl
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cap = Math.min(dpr, 2);
    canvas.width = size * cap;
    canvas.height = size * cap;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(cap, cap);
    drawVinyl(ctx, size, skin.label.ringColor, palette);
  }, [size, skin.label.ringColor, palette, state.transitionKey]);

  // Spin animation via WAAPI
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!animationRef.current) {
      animationRef.current = canvas.animate(
        [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
        { duration: SPIN_DURATION_MS, iterations: Infinity, easing: 'linear' }
      );
      animationRef.current.playbackRate = 0;
    }
    const anim = animationRef.current;

    const targetRate = state.isPlaying && !prefersReducedMotion() ? 1 : 0;
    easePlaybackRate(anim, targetRate, 1500);

    return () => {
      // Don't cancel on unmount in dev; cleanup on real unmount happens implicitly
    };
  }, [state.isPlaying, state.transitionKey]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, display: 'block', borderRadius: '50%' }}
      />
      {/* Non-rotating gloss overlay */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 30% at 40% 25%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)',
        }}
      />
    </div>
  );
}

function drawVinyl(
  ctx: CanvasRenderingContext2D,
  size: number,
  ringColor: string,
  palette: Palette | null
) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  // Base disc
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Grooves
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let rr = r * 0.35; rr < r * 0.97; rr += 2) {
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Label ring (skin)
  ctx.fillStyle = ringColor;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Inner label (palette-derived)
  const labelColor = palette?.dominant ?? '#777777';
  ctx.fillStyle = labelColor;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Center hole
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.02, 0, Math.PI * 2);
  ctx.fill();
}

function easePlaybackRate(animation: Animation, target: number, durationMs: number) {
  const start = animation.playbackRate;
  const startTime = performance.now();
  function step(now: number) {
    const t = Math.min(1, (now - startTime) / durationMs);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    animation.playbackRate = start + (target - start) * eased;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(scene): Vinyl canvas with WAAPI spin + palette label"
```

---

### Task 25: Tonearm SVG

**Files:**
- Create: `src/scene/Tonearm.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useSkin } from '../skins/useSkin';
import type { TurntableState } from '../playback/deriveTurntableState';

interface Props {
  state: TurntableState;
}

export function Tonearm({ state }: Props) {
  const skin = useSkin();
  const playing = state.isPlaying;
  const reduced = prefersReducedMotion();

  const angle = playing ? 25 : 0;

  return (
    <svg
      viewBox="0 0 200 200"
      width={200}
      height={200}
      style={{ overflow: 'visible' }}
      aria-hidden
    >
      <g
        style={{
          transformOrigin: '170px 30px',
          transform: `rotate(${angle}deg)`,
          transition: reduced ? 'none' : 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Pivot base */}
        <circle cx={170} cy={30} r={10} fill={skin.tonearm.color} />
        {/* Arm */}
        <rect
          x={60}
          y={26}
          width={110}
          height={8}
          rx={3}
          fill={skin.tonearm.color}
        />
        {/* Headshell (counter-rotates) */}
        <g
          style={{
            transformOrigin: '65px 30px',
            transform: `rotate(${-angle}deg)`,
            transition: reduced ? 'none' : 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <rect
            x={50}
            y={22}
            width={20}
            height={16}
            rx={2}
            fill={skin.tonearm.headshell}
          />
        </g>
      </g>
    </svg>
  );
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(scene): Tonearm SVG with pivot animation"
```

---

### Task 26: Cabinet + Turntable composition

**Files:**
- Create: `src/scene/Cabinet.tsx`, `src/scene/Turntable.tsx`

- [ ] **Step 1: Cabinet**

```tsx
// src/scene/Cabinet.tsx
import { useSkin } from '../skins/useSkin';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function Cabinet({ children }: Props) {
  const skin = useSkin();
  return (
    <div
      className="relative rounded-lg shadow-2xl"
      style={{
        width: 560,
        height: 460,
        background: `linear-gradient(180deg, ${skin.cabinet.fill} 0%, #2a1810 100%)`,
        border: `1px solid ${skin.cabinet.accent}`,
        transform: 'perspective(1200px) rotateX(8deg)',
        transformOrigin: 'center bottom',
      }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Turntable**

```tsx
// src/scene/Turntable.tsx
import { Vinyl } from './Vinyl';
import { Tonearm } from './Tonearm';
import { useSkin } from '../skins/useSkin';
import type { TurntableState } from '../playback/deriveTurntableState';

interface Props {
  state: TurntableState;
}

export function Turntable({ state }: Props) {
  const skin = useSkin();
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Mat */}
      <div
        className="absolute rounded-full"
        style={{
          width: 440,
          height: 440,
          background: skin.platter.matColor,
          opacity: 0.6,
        }}
      />
      {/* Vinyl (only when something is playing/ad) */}
      {state.kind !== 'idle' && <Vinyl state={state} size={420} />}
      {/* Tonearm */}
      <div className="absolute top-0 right-0 -translate-y-3 translate-x-3">
        <Tonearm state={state} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(scene): Cabinet + Turntable composition"
```

---

### Task 27: Scene assembly

**Files:**
- Create: `src/scene/Scene.tsx`, `src/ui/TrackInfo.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: TrackInfo**

```tsx
// src/ui/TrackInfo.tsx
import type { TurntableState } from '../playback/deriveTurntableState';

interface Props {
  state: TurntableState;
  hidden: boolean;
}

export function TrackInfo({ state, hidden }: Props) {
  if (state.kind === 'idle') {
    return (
      <div
        className={`fixed bottom-6 left-6 text-white/60 text-sm transition-opacity ${
          hidden ? 'opacity-0' : 'opacity-100'
        }`}
      >
        Play something on Spotify
      </div>
    );
  }
  if (state.kind === 'ad') return null;
  return (
    <div
      className={`fixed bottom-6 left-6 text-white transition-opacity ${
        hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="font-semibold">{state.title}</div>
      <div className="text-sm text-white/70">{state.subtitle}</div>
    </div>
  );
}
```

- [ ] **Step 2: Scene**

```tsx
// src/scene/Scene.tsx
import { useSkin } from '../skins/useSkin';
import { useUiStore } from '../store/uiStore';
import { usePlayback } from '../spotify/usePlayback';
import { deriveTurntableState } from '../playback/deriveTurntableState';
import { Cabinet } from './Cabinet';
import { Turntable } from './Turntable';
import { SleeveCard } from './SleeveCard';
import { TrackInfo } from '../ui/TrackInfo';
import { SpotifyAttribution } from '../ui/SpotifyAttribution';
import { CleanModeToggle } from '../ui/CleanModeToggle';

export function Scene() {
  const skin = useSkin();
  const cleanMode = useUiStore(s => s.cleanMode);
  const { snapshot, error } = usePlayback();
  const state = deriveTurntableState(snapshot);

  const externalUrl =
    state.kind === 'track' || state.kind === 'episode' ? state.externalUrl : null;

  if (error && (error as Error).name === 'ForbiddenError') {
    return (
      <div className="h-full flex items-center justify-center bg-black text-white text-center px-6">
        <div className="max-w-md">
          <h2 className="text-xl font-semibold mb-2">Your Spotify account isn't authorized.</h2>
          <p className="text-white/70 text-sm">
            This app is in Spotify Development Mode. Ask the owner to add your Spotify email under
            User Management in the Developer Dashboard, then refresh.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full w-full overflow-hidden"
      style={{ background: skin.wall.background }}
    >
      <CleanModeToggle />
      <div className="h-full flex items-center justify-center gap-12 px-12">
        <SleeveCard state={state} />
        <div className="relative">
          <Cabinet>
            <Turntable state={state} />
          </Cabinet>
        </div>
      </div>
      <TrackInfo state={state} hidden={cleanMode} />
      <SpotifyAttribution externalUrl={externalUrl} />
    </div>
  );
}
```

- [ ] **Step 3: Wire Scene into App**

Replace `src/App.tsx`:
```tsx
import { LoginScreen } from './ui/LoginScreen';
import { CallbackRoute } from './ui/CallbackRoute';
import { Scene } from './scene/Scene';
import { useAuth } from './auth/useAuth';
import { isMockMode } from './env';

export default function App() {
  const { isAuthed } = useAuth();

  if (window.location.pathname === '/callback') {
    return <CallbackRoute />;
  }
  if (!isAuthed && !isMockMode()) {
    return <LoginScreen />;
  }
  return <Scene />;
}
```

- [ ] **Step 4: Update App.test.tsx**

```tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

function renderWithQuery(ui: React.ReactNode) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

test('renders login when unauthenticated and not in mock mode', () => {
  renderWithQuery(<App />);
  expect(screen.getByRole('button', { name: /connect spotify/i })).toBeInTheDocument();
});
```

- [ ] **Step 5: Run tests**

```bash
npm test
```

- [ ] **Step 6: Manual smoke with mock mode**

```bash
npm run dev
```
Visit `http://127.0.0.1:5173/?mock=1` — should render the full scene with the mock track. Stop server.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(scene): assemble Scene; wire into App with mock mode bypass"
```

---

## Phase 6: E2E Tests + Visual Regression

### Task 28: Visual regression tests

**Files:**
- Create: `tests/e2e/visual.spec.ts`
- Delete: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Replace smoke with visual.spec.ts**

```ts
import { test, expect } from '@playwright/test';

test.describe('Visual regression — mock mode', () => {
  test('full scene with mock track', async ({ page }) => {
    await page.goto('/?mock=1');
    // Wait for vinyl canvas to render
    await page.waitForSelector('canvas');
    // Wait for animation to settle
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('scene-mock-track.png', { maxDiffPixelRatio: 0.02 });
  });

  test('login screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('VinylVision')).toBeVisible();
    await expect(page).toHaveScreenshot('login.png', { maxDiffPixelRatio: 0.02 });
  });
});
```

- [ ] **Step 2: Delete smoke.spec.ts**

```bash
rm tests/e2e/smoke.spec.ts
```

- [ ] **Step 3: Generate baselines**

```bash
npm run test:e2e -- --update-snapshots
```

- [ ] **Step 4: Run again, verify pass**

```bash
npm run test:e2e
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test(e2e): visual regression for scene + login"
```

---

### Task 29: Mocked OAuth E2E tests

**Files:**
- Create: `tests/e2e/auth.spec.ts`

- [ ] **Step 1: Implement**

```ts
import { test, expect } from '@playwright/test';

test.describe('OAuth flow (mocked)', () => {
  test('login button redirects to Spotify authorize', async ({ page }) => {
    await page.goto('/');
    // Intercept the Spotify authorize URL navigation
    const navigation = page.waitForRequest(req =>
      req.url().startsWith('https://accounts.spotify.com/authorize')
    );
    await page.getByRole('button', { name: /connect spotify/i }).click();
    const req = await navigation;
    const url = new URL(req.url());
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('state')).toBeTruthy();
    expect(url.searchParams.get('scope')).toBe('user-read-currently-playing');
  });

  test('callback with denied error returns to login', async ({ page }) => {
    await page.goto('/callback?error=access_denied');
    await expect(page.getByText(/denied/i)).toBeVisible();
  });

  test('callback with missing state shows error', async ({ page }) => {
    await page.goto('/callback?code=abc');
    await expect(page.getByText(/missing|state/i)).toBeVisible();
  });
});
```

- [ ] **Step 2: Run**

```bash
npm run test:e2e
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test(e2e): mocked OAuth flow tests"
```

---

## Phase 7: PWA + Polish

### Task 30: PWA manifest

**Files:**
- Create: `public/manifest.webmanifest`, `public/icons/icon-192.png`, `public/icons/icon-512.png`
- Modify: `index.html`

- [ ] **Step 1: Create manifest**

```json
{
  "name": "VinylVision",
  "short_name": "VinylVision",
  "start_url": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 2: Generate placeholder icons**

For v1 ship-ability, generate two solid-color PNG icons:
```bash
mkdir -p public/icons
# Use any tool. For a quick placeholder, this Node snippet:
node -e "
const fs = require('fs');
const { createCanvas } = require('canvas');
// If 'canvas' isn't installed, fall back to manual:
console.log('Install canvas or create icons manually. Skipping for now.');
"
```

If `canvas` package isn't available, create solid-black 192×192 and 512×512 PNG icons manually in any image editor (or download a free vinyl icon from a CC0 source). Place them at `public/icons/icon-192.png` and `public/icons/icon-512.png`.

- [ ] **Step 3: Link manifest from index.html**

Modify `index.html`. Inside `<head>`, add:
```html
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#000000" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(pwa): manifest + apple-touch icons"
```

---

### Task 31: Resize / DPR redraw + reduced-motion handling

**Files:**
- Modify: `src/scene/Vinyl.tsx`

- [ ] **Step 1: Add resize + DPR + reduced-motion observers**

In `src/scene/Vinyl.tsx`, replace the redraw effect with one that also redraws on `resize` and DPR changes:

```tsx
// Add this state + effect right after the palette useEffect:
const [redrawTick, setRedrawTick] = useState(0);

useEffect(() => {
  function bump() {
    setRedrawTick(t => t + 1);
  }
  window.addEventListener('resize', bump);
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', bump);
  // DPR change: matchMedia on resolution
  const dprMq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  dprMq.addEventListener('change', bump);
  return () => {
    window.removeEventListener('resize', bump);
    mq.removeEventListener('change', bump);
    dprMq.removeEventListener('change', bump);
  };
}, []);
```

And update the redraw effect dependency array to include `redrawTick`:

```tsx
useEffect(() => {
  // ... existing draw code
}, [size, skin.label.ringColor, palette, state.transitionKey, redrawTick]);
```

- [ ] **Step 2: Verify dev**

```bash
npm run dev
```
Resize the window at `/?mock=1` — the vinyl shouldn't blur. Stop server.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(scene): redraw on resize, DPR change, reduced-motion change"
```

---

## Phase 8: Deploy

### Task 32: Deploy to Vercel + register prod redirect URI

**Files:** None (configuration step)

- [ ] **Step 1: Install Vercel CLI (if needed)**

```bash
npm install -g vercel
```

- [ ] **Step 2: Deploy preview**

```bash
vercel
```
Follow prompts: link to a new project named `vinyl-visualizer`. Accept defaults.

- [ ] **Step 3: Note the preview URL**

After deploy completes, Vercel prints a URL like `https://vinyl-visualizer-xxx.vercel.app`. **Don't use this for OAuth** — preview URLs change.

- [ ] **Step 4: Promote to production**

```bash
vercel --prod
```
Vercel prints a production URL like `https://vinyl-visualizer.vercel.app`.

- [ ] **Step 5: Set VITE_SPOTIFY_CLIENT_ID in Vercel**

```bash
vercel env add VITE_SPOTIFY_CLIENT_ID production
```
Paste: `e9fceabcee074982bb372ca66e7f0b0c`. Redeploy:
```bash
vercel --prod
```

- [ ] **Step 6: Register prod redirect URI in Spotify Dashboard**

Open https://developer.spotify.com/dashboard → VinylVision → Settings → Redirect URIs. **Add**: `https://vinyl-visualizer.vercel.app/callback` (or whatever your production URL is). Save.

- [ ] **Step 7: Verify prod auth flow**

Open `https://vinyl-visualizer.vercel.app` in browser. Click Connect Spotify. Complete auth. Scene should render with live playback.

- [ ] **Step 8: Document deployed URL**

Modify `docs/superpowers/specs/2026-05-25-vinylvision-design.md` — replace `<stable-custom-domain>` with the actual Vercel domain.

```bash
git add docs/
git commit -m "docs: record production URL in spec"
git push
```

---

### Task 33: Final manual QA pass

**Files:** None (manual)

- [ ] **Step 1: Run through QA checklist from spec**

Verify each item from the spec's "Manual QA checklist" section:
1. Fresh login flow on Mac browser ✓
2. Play/pause/skip on phone → visuals react within 3s ✓
3. Vintage Oak skin renders cleanly with multiple albums ✓
4. Clean mode (F key) hides chrome but **sleeve card + Spotify attribution remain visible** ✓
5. Tab-hidden pauses polling (verify in DevTools network) ✓
6. Two tabs open → only one polls (tab leader works) ✓
7. iPad mock data view (`?mock=1`) renders correctly on Safari over LAN ✓
8. Vercel deploy: real auth + playback on iPad against prod URL; Add to Home Screen launches fullscreen PWA ✓

- [ ] **Step 2: Fix anything that fails, commit fixes**

For each failure, open an issue or fix inline.

- [ ] **Step 3: Tag v1 release**

```bash
git tag -a v1.0 -m "VinylVision v1 — personal Spotify mirror"
git push --tags
```

---

## Done

When all tasks are checked, you have:

- A working web app deployed to Vercel.
- Spotify mirror playback updating every 3s.
- One polished skin (Vintage Oak) with abstract palette-derived vinyl, unmodified sleeve card, persistent attribution.
- Clean display mode for TV/iPad ambient use.
- PWA installable on iPad.
- Test suite: Vitest units + Playwright visual + mocked OAuth E2E.
- All Spotify compliance constraints respected.

v1.1 work (deferred, see spec): Classic Black, Retro Red, Hi-Fi Silver, Neon Dark skins + skin picker UI; lyrics; audio visualizer; song info panel.
