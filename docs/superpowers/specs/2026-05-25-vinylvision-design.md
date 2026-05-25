# VinylVision — Design Spec

**Date:** 2026-05-25
**Status:** Approved (brainstorm phase)

## Summary

A web app that mirrors the user's Spotify playback as an animated, against-the-wall record player. Album art maps onto a spinning vinyl, the tonearm reacts to play/pause, and the cabinet/wall scene is themable via 5 skins. Targets iPad and TV display; deployed as a static web app.

## Goals

- Make listening to Spotify feel like a physical, tactile experience worth leaving up on a screen.
- Live-sync visuals to Spotify playback state within ~3 seconds.
- Look beautiful enough at rest that it works as ambient display on an iPad or TV.

## Non-Goals (v1)

- Controlling Spotify playback from the app (mirror mode only).
- Lyrics, audio visualizer, song info panel, queue, search.
- Apple Music, YouTube Music, or any non-Spotify source.
- Account switching, multi-user support.
- Native iOS/tvOS app (web app only; iPad uses Safari/PWA).

## Locked-In Product Decisions

| Decision | Choice |
|---|---|
| Integration style | **Mirror mode** — read Spotify state, no playback control |
| Visual fidelity | **2.5D Canvas/CSS hybrid** — painted highlights, perspective tilt, no Three.js |
| v1 scope | **MVP + 5 skins + clean display mode** |
| Hosting | **Local dev + deploy to Vercel** |
| Default skin | **Vintage Oak** |
| Skin switcher | All 5 skins selectable in-app (Vintage Oak, Classic Black, Retro Red, Hi-Fi Silver, Neon Dark) |

## Architecture

### Stack

- **React 18 + Vite + TypeScript** — fast dev, type safety against Spotify's deeply nested API responses.
- **Zustand** — lightweight state for ~5 pieces of state (track, isPlaying, skin, cleanMode, auth).
- **Tailwind CSS** — layout and base styling.
- **Canvas 2D** — vinyl rendering (grooves, label, gloss). Redrawn only on track change; spin handled by CSS transform.
- **SVG** — tonearm (single rotatable group with transform-origin at pivot).
- **CSS** — cabinet, wall, perspective tilt, skin theming via CSS variables.
- **No backend** — PKCE OAuth runs in the browser; tokens in `sessionStorage`.
- **Deploy** — Vercel free tier, auto-deploy from Git.

### Why these choices

- TypeScript over JS: Spotify API response shapes are deep and easy to mistype.
- Zustand over Redux/Context: minimal state, no boilerplate, no re-render headaches.
- Canvas + SVG hybrid over pure Canvas: tonearm is one declarative element with one animatable property — no need to redraw it inside a canvas loop.
- `sessionStorage` over `localStorage` for tokens: cleared on tab close, safer.

## Component Structure

```
src/
├── main.tsx                    React entry
├── App.tsx                     Top-level layout, routes between login and scene
├── auth/
│   ├── pkce.ts                 PKCE code verifier/challenge helpers
│   ├── spotifyAuth.ts          Login redirect, token exchange, refresh
│   └── useAuth.ts              Hook: { token, login(), logout() }
├── spotify/
│   ├── client.ts               fetch wrapper, auth header, 401 → refresh, 429 backoff
│   ├── nowPlaying.ts           GET /me/player/currently-playing
│   └── usePolling.ts           Hook: polls every 3s, pauses on tab hidden
├── scene/
│   ├── Scene.tsx               Wall + cabinet + turntable composition
│   ├── Cabinet.tsx             Base, skin-driven
│   ├── Turntable.tsx           Platter + vinyl + tonearm
│   ├── Vinyl.tsx               Canvas: grooves, label, spin
│   └── Tonearm.tsx             SVG: pivots on play/pause
├── skins/
│   ├── types.ts                Skin interface
│   ├── skins.ts                All 5 skin definitions
│   └── SkinPicker.tsx          Settings panel UI
├── ui/
│   ├── TrackInfo.tsx           Subtle title/artist/album overlay
│   ├── LoginScreen.tsx         Pre-auth landing
│   └── CleanModeToggle.tsx     F key / tap-and-hold to hide chrome
├── store/
│   └── appStore.ts             Zustand: { track, isPlaying, skin, cleanMode, auth }
└── styles/
    └── globals.css             Tailwind + base styles
```

### Boundaries

- `auth/` and `spotify/` are pure data layers — no visual dependencies.
- `scene/` reads from the store and renders — no Spotify dependency. Swappable source.
- Each component reads its skin slice via a `useSkin()` selector.
- `Vinyl.tsx` is the only canvas-heavy file.

## Data Flow

### Auth (PKCE)

1. User clicks "Connect Spotify" on `LoginScreen`.
2. App generates random `code_verifier`, derives `code_challenge` (SHA-256), stores verifier in `sessionStorage`.
3. Redirect to Spotify authorize URL with challenge + scopes (`user-read-currently-playing`, `user-read-playback-state`).
4. Spotify redirects to `http://127.0.0.1:5173/callback` (dev) or the deployed HTTPS URL (prod) with `?code=...`.
5. App POSTs `code` + `code_verifier` to Spotify token endpoint → `access_token` (1hr) + `refresh_token`.
6. Tokens stored in `sessionStorage`. Route to main scene.

### Playback sync loop

1. `usePolling` fires every **3 seconds** while scene is mounted and tab is visible.
2. Calls `GET /me/player/currently-playing`.
3. Response normalized into store: `{ track: { id, name, artist, album, artworkUrl }, isPlaying, progressMs }`.
4. Components subscribe to slices:
   - `Vinyl` watches `track.artworkUrl` + `isPlaying`.
   - `Tonearm` watches `isPlaying`.
   - `TrackInfo` watches `track.name` + `track.artist`.
5. Track changes detected by comparing `track.id`. Visual swap debounced 500ms to avoid flicker on rapid skipping.

### Visual state transitions

| Spotify event | Visual reaction |
|---|---|
| New track | Tonearm lifts → vinyl fades out → new vinyl fades in with new artwork → tonearm lowers |
| Pause | Tonearm lifts off vinyl; vinyl decelerates to stop (CSS ease-out, ~1.5s) |
| Resume | Tonearm lowers; vinyl accelerates to 33⅓ RPM (~1.8s/rev) |
| Nothing playing | Idle turntable, no vinyl, gentle "play something on Spotify" hint |
| 401 from API | Silent refresh; retry once; on second 401 → re-login |

### Polling discipline

- 3s interval — rate-limit safe, feels live.
- Pause polling when `document.visibilityState === 'hidden'`.
- Resume on visibility regain.

## Visual System

### Scene layout

- Cabinet sits at ~60% viewport height with `perspective: 1200px` + `rotateX(8deg)` for an against-the-wall feel.
- Vinyl centered on the cabinet's platter.
- Tonearm pivots from a fixed point at the cabinet's top-right; swings ~25° to rest on the vinyl when playing.
- Track info (title · artist): bottom-left, low-opacity, hidden in clean mode.

### Vinyl (Canvas 2D)

- Concentric dark-grey grooves with subtle noise for wear.
- Radial gradient gloss highlight rotated with the disc to fake a moving reflection.
- Album artwork drawn as a circular clipped label at ~30% of disc radius.
- Small dark center hole.
- Spin: CSS `transform: rotate()` animation on the canvas element, 360° / 1.8s linear infinite (33⅓ RPM). `animation-play-state` toggles on pause.

### Tonearm (SVG)

- Single `<g>` with `transform-origin` at the pivot point.
- Two states: `idle` (raised, ~0°), `playing` (~25°, lowered).
- 0.8s cubic-bezier transition between states.
- Headshell counter-rotates to stay parallel to the vinyl surface.

### Skin system

Each skin is a plain object:

```ts
{
  id: 'vintage-oak',
  name: 'Vintage Oak',
  wall: { background: 'linear-gradient(...)', texture?: url },
  cabinet: { fill: '#6b4423', grain: 'wood', accent: '#c9a875' },
  platter: { color: '#1a1a1a', mat: 'felt-cream' },
  tonearm: { color: '#b8860b', headshell: '#222' },
  label: { ringColor: '#f4e4bc' },
}
```

Scene components consume via `useSkin()`. Switching skins triggers React re-render — no reload. Selected skin persisted to `localStorage`.

### Clean mode

- `cleanMode: true` in store hides `TrackInfo`, `SkinPicker` trigger, and all chrome via `opacity-0 pointer-events-none`.
- Vinyl + tonearm + cabinet remain.
- Toggle: `F` key on desktop, tap-and-hold (1s) on iPad.

### Performance budget

- Canvas redraw only on track change (not per frame).
- Spin animation pure CSS — GPU compositor handles it.
- Target: 60fps on iPad Air.
- No `requestAnimationFrame` loops outside brief track-swap transitions.

## Error Handling & Edge Cases

### Auth failures

- User denies Spotify auth → return to login with friendly message.
- Token exchange fails → show error + retry button.
- Refresh token expired (~6 months) → force re-login.

### API failures

- 401 mid-session → silent refresh, retry once. Second 401 → re-login.
- 429 rate-limited → respect `Retry-After`, back off polling.
- Network offline → keep last known state, show "Reconnecting…" dot, resume on regain.
- 500/timeout → exponential backoff (3s → 6s → 12s, cap).

### Playback edge cases

- Nothing playing → idle turntable, prompt to play.
- Non-music item (podcast) → generic disc with podcast image, or idle if no artwork.
- Local file without artwork → skin's default label texture.
- Rapid skipping → debounce visual swap by 500ms; only animate after track id is stable.

### Visual edge cases

- Album art loading → show skin's default label until image loads, then crossfade.
- Non-square artwork → center-crop to square for label.
- Tab hidden → pause polling and CSS spin (battery).

### Explicit non-handling (v1)

- Multiple Spotify accounts / account switching.
- Showing devices / transferring playback.
- Offline mode beyond "show last state."
- Lyrics, queue, search.

## Testing Strategy

| Layer | Approach | Tool |
|---|---|---|
| PKCE helpers | Unit, pure functions | Vitest |
| Spotify client | Unit with mocked fetch — 401 retry, refresh, 429 backoff | Vitest + MSW |
| `usePolling` hook | Hook test — interval, pause-on-hidden, cleanup | Vitest + RTL |
| Zustand store | Unit — track-change detection, skin switch, clean mode | Vitest |
| Skin system | Snapshot — each skin renders without throwing | RTL |
| Scene components | Smoke — renders without crashing given a track | RTL |
| Vinyl canvas | Not unit tested. Manual QA. | — |
| Tonearm transitions | Not unit tested. Manual QA. | — |

### Skipped intentionally

- E2E auth tests (would require real Spotify account in CI).
- Visual regression tests.
- Performance benchmarks.

### Manual QA checklist (pre-deploy)

1. Fresh login on Mac browser.
2. Play/pause/skip on phone — visuals react within 3s.
3. All 5 skins render cleanly.
4. Clean mode hides chrome via `F` key.
5. Tab-hidden pauses polling (verified in DevTools).
6. Loads on iPad Safari via local network.
7. After Vercel deploy: loads on iPad standalone, full PWA fullscreen via Add to Home Screen.

## Deployment

- **Dev:** `npm run dev` on MacBook, accessible at `http://127.0.0.1:5173`. iPad reaches it via Mac's local IP on Wi-Fi.
- **Prod:** Vercel auto-deploy from `main` branch. HTTPS URL added as a second Redirect URI in the Spotify app settings.
- **Spotify Redirect URIs:**
  - `http://127.0.0.1:5173/callback` (dev)
  - `https://<vercel-url>/callback` (prod, added when deployed)

## Spotify App

- **Client ID:** `e9fceabcee074982bb372ca66e7f0b0c`
- **Scopes:** `user-read-currently-playing`, `user-read-playback-state`
- **APIs enabled:** Web API, Web Playback SDK (SDK reserved for future; not used in v1)
- **Mode:** Development (≤25 users, no approval needed)
