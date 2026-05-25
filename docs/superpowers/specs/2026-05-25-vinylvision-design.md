# VinylVision — Design Spec

**Date:** 2026-05-25
**Status:** Approved (brainstorm phase, revised after Codex review)

## Summary

A web app that mirrors the user's Spotify playback as an animated, against-the-wall record player. Album artwork is displayed as an unmodified square sleeve card alongside an abstract skin-colored vinyl on a turntable that spins, with a tonearm that reacts to play/pause. Visually themable; one skin in v1. Targets iPad and TV display; deployed as a static web app.

## Goals

- Make Spotify listening feel like a physical, tactile experience worth leaving up on a screen.
- Live-sync visuals to Spotify playback state within ~3 seconds.
- Comply with Spotify's design and developer policies so this remains shippable as we grow it.

## Non-Goals (v1)

- Controlling Spotify playback from the app (mirror mode only).
- Lyrics, audio visualizer, song info panel beyond title/artist/album, queue, search.
- Apple Music, YouTube Music, or any non-Spotify source.
- Account switching, multi-user support.
- Native iOS/tvOS app (web app only).
- Public/commercial distribution (Development Mode, ≤5 authorized Premium users).
- Skins beyond Vintage Oak (deferred to v1.1).

## Locked-In Product Decisions

| Decision | Choice |
|---|---|
| Integration style | **Mirror mode** — read Spotify state, no playback control |
| Visual fidelity | **2.5D Canvas/CSS hybrid** — painted highlights, perspective tilt |
| v1 scope | **One skin (Vintage Oak) + clean display mode + compliant artwork handling** |
| Hosting | **Local dev + deploy to Vercel** |
| Artwork compliance | **Path A** — unmodified square sleeve display, abstract vinyl label (palette-derived), persistent Spotify attribution |

## Spotify Compliance Model

This is a hard constraint that shapes the visual design. Album artwork must:

- Be shown **unmodified and uncropped** as a square sleeve card. No circular clipping of album art.
- Link back to the track/album on Spotify.
- Have visible Spotify attribution.

The spinning vinyl is therefore **decorative and abstract**, not a carrier of artwork:

- The vinyl's center label is filled with colors derived from the album artwork (via runtime palette extraction) plus the active skin's label-ring color.
- The artwork itself appears as a static **sleeve card** beside or above the turntable, with the track title, artist, album name, and a "Listen on Spotify" link.
- Clean mode dims the surrounding chrome but keeps the sleeve card, attribution, and Spotify link visible.

## Architecture

### Stack

- **React 18 + Vite + TypeScript** — fast dev, type safety for nested Spotify response shapes.
- **Zustand** — UI state only (skin id, clean mode, normalized playback snapshot).
- **TanStack Query** — owns the polling fetch lifecycle (interval, retry, stale-time, cancellation, focus refetch). Replaces the originally-planned custom `usePolling` hook so we don't reinvent that wheel.
- **Tailwind CSS** — layout and base styling.
- **Canvas 2D** — abstract vinyl rendering (grooves, label, palette wash). Redraw triggers in §Rendering.
- **SVG** — tonearm.
- **CSS** — cabinet, wall, perspective tilt, skin theming via CSS variables.
- **`node-vibrant` (or similar)** — extract a small color palette from album artwork to drive the abstract vinyl label.
- **No backend.** PKCE OAuth in the browser. Tokens isolated in a dedicated `auth/tokenStore` module (NOT in the Zustand UI store).
- **Deploy:** Vercel free tier with SPA fallback rewrite so `/callback` resolves to `index.html`.

### Why these choices

- **TanStack Query** over a hand-rolled polling hook: Codex flagged the originally-planned `usePolling` as overloaded (interval + visibility + retry + 401 refresh + 429 backoff + cancellation + dedupe). Query handles most of this idiomatically; the auth-aware fetch wrapper underneath handles 401/429.
- **Tokens out of Zustand**: any XSS reaching app state shouldn't trivially exfiltrate tokens. Narrow access surface.
- **Canvas + SVG hybrid**: tonearm has a single animatable property (rotation), so SVG is better than driving it inside a canvas loop.

## Component Structure

```
src/
├── main.tsx                    React entry
├── App.tsx                     Top-level layout, routes between login and scene
├── auth/
│   ├── pkce.ts                 PKCE verifier/challenge + random `state` helpers
│   ├── spotifyAuth.ts          Login redirect, callback handler, token exchange, refresh
│   ├── tokenStore.ts           Isolated token storage (sessionStorage), get/set/clear
│   └── useAuth.ts              Hook: { isAuthed, login(), logout() }
├── spotify/
│   ├── client.ts               fetch wrapper: auth header, 401→refresh+retry-once, 429 Retry-After
│   ├── nowPlaying.ts           GET /me/player/currently-playing (with additional_types=track,episode)
│   ├── normalize.ts            Raw response → PlaybackSnapshot; handles track|episode|ad|unknown
│   └── usePlayback.ts          TanStack Query hook over nowPlaying; pauses on hidden tab
├── playback/
│   ├── types.ts                PlaybackSnapshot, TurntableState
│   └── deriveTurntableState.ts Map snapshot → { kind, sleeve, title, artist, isPlaying, transitionKey }
├── scene/
│   ├── Scene.tsx               Wall + cabinet + turntable composition
│   ├── Cabinet.tsx             Base, skin-driven
│   ├── Turntable.tsx           Platter + vinyl + tonearm
│   ├── Vinyl.tsx               Canvas: grooves, abstract label, static gloss overlay (non-rotating)
│   ├── Tonearm.tsx             SVG: pivots on play/pause
│   └── SleeveCard.tsx          Unmodified square artwork + title/artist + "Listen on Spotify" link
├── skins/
│   ├── types.ts                Skin interface
│   ├── skins.ts                Vintage Oak only in v1
│   └── useSkin.ts              Selector hook
├── palette/
│   └── extractPalette.ts       Pull dominant colors from album artwork for vinyl label
├── ui/
│   ├── TrackInfo.tsx           Subtle title/artist overlay; redundant with SleeveCard
│   ├── LoginScreen.tsx         Pre-auth landing
│   ├── CleanModeToggle.tsx     F key / tap-and-hold; clean mode preserves attribution
│   └── SpotifyAttribution.tsx  Persistent "Listen on Spotify" + logo where required
├── store/
│   └── uiStore.ts              Zustand: { skin, cleanMode } only — no tokens, no raw track
├── lib/
│   └── tabLeader.ts            BroadcastChannel-based leader election (only leader tab polls)
└── styles/
    └── globals.css             Tailwind + base styles
```

### Boundaries

- `auth/` and `spotify/` are pure data layers — no visual dependencies.
- `playback/` produces a normalized `TurntableState`; scene components never read raw Spotify shapes.
- `scene/` reads from `TurntableState` + active skin — no Spotify dependency.
- Tokens live only in `auth/tokenStore.ts`. Nothing else reads `sessionStorage` directly.

## Data Flow

### Auth (PKCE)

1. User clicks "Connect Spotify" on `LoginScreen`.
2. App generates random `code_verifier`, derives `code_challenge` (SHA-256), generates a random `state` value. Both stored in `sessionStorage`.
3. Redirect to Spotify authorize URL with `code_challenge`, `state`, and minimal scope: **`user-read-currently-playing`** only.
4. Spotify redirects to `http://127.0.0.1:5173/callback` (dev) or `https://<vercel-domain>/callback` (prod) with `?code=...&state=...`.
5. App validates returned `state` against stored value; rejects on mismatch.
6. POSTs `code` + `code_verifier` to Spotify token endpoint → `access_token` (1hr) + `refresh_token`.
7. `history.replaceState` strips `?code=...&state=...` from URL.
8. Verifier and state cleared from `sessionStorage`; tokens stored in `tokenStore`.
9. Route to main scene.

### Refresh

- Single in-flight refresh promise; concurrent 401s share it.
- On successful refresh, store new `access_token`. If the response includes a new `refresh_token`, replace it; otherwise keep the existing one.
- On refresh failure, clear tokens and route to login. No assumed expiry window for the refresh token itself.

### Playback sync loop

- Owned by `usePlayback` (TanStack Query).
- Calls `GET /me/player/currently-playing?additional_types=track,episode` every **3 seconds** while authed.
- Pauses on `document.visibilityState === 'hidden'`; resumes on visible.
- Only the **tab leader** (via BroadcastChannel) polls. Other tabs receive the snapshot via broadcast.
- Response normalized into `PlaybackSnapshot` based on `currently_playing_type`:

| `currently_playing_type` | Handling |
|---|---|
| `track` | Read `item.album.images[0].url`, `item.name`, `item.artists[*].name`, `item.uri`, `item.external_urls.spotify` |
| `episode` | Read `item.images[0].url`, `item.name`, `item.show.name` as "artist", `item.uri`, `item.external_urls.spotify` |
| `ad` | Snapshot type `ad` — turntable spins, no sleeve card, generic "advertisement" label |
| `unknown` / null | Snapshot type `idle` — no vinyl, prompt to play |

- `deriveTurntableState` produces a stable `transitionKey` (URI when available, else composite of name+artist) so visuals only swap when identity actually changes. Visual swap debounced 500ms.

### Visual state transitions

| Event | Visual reaction |
|---|---|
| New transitionKey | Tonearm lifts → vinyl fades out → palette extracted from new artwork → new vinyl + sleeve card fade in → tonearm lowers |
| Pause | Tonearm lifts; vinyl decelerates to stop (~1.5s) |
| Resume | Tonearm lowers; vinyl accelerates to 33⅓ RPM |
| Idle | No vinyl, prompt to play |
| Ad | Generic spinning vinyl, no sleeve card |
| 401 from API | Silent refresh + retry once; second failure → re-login |
| 403 from API | Likely unauthorized dev user — show "this Spotify account isn't authorized" screen with instructions |
| 429 from API | Honor `Retry-After`, pause polling for that duration |

## Visual System

### Scene layout

- Cabinet sits ~60% down viewport, `perspective: 1200px` + `rotateX(8deg)`.
- Turntable centered on cabinet.
- Sleeve card positioned to the left of (or above on portrait iPad) the turntable, sized so artwork stays square and uncropped.
- Tonearm pivots from a fixed point on the cabinet's top-right; swings ~25° to rest on vinyl when playing.
- Persistent `SpotifyAttribution` in a corner; clickable, links to current track/episode in Spotify.

### Vinyl (Canvas 2D, abstract)

- Concentric dark-grey grooves with subtle noise.
- Center **abstract label**: filled with dominant color extracted from album artwork, framed by skin's label-ring color. No album art on it.
- Small dark center hole.
- **Gloss highlight is a separate non-rotating overlay** above the rotating canvas — light source stays fixed while the disc spins beneath it.
- Spin: CSS `transform: rotate()` animation on the canvas element. 360° / 1.8s linear infinite. `animation-play-state` toggles with playback. Respects `prefers-reduced-motion` (no spin, just static label).

### Canvas redraw triggers

The canvas redraws on:
- transitionKey change (new track/episode)
- Skin change
- Active skin's label palette change
- Artwork load completion or load error
- Resize (debounced)
- Device pixel ratio change
- `prefers-reduced-motion` change

Canvas backing resolution is capped at 2× DPR or 1600px (whichever smaller) to keep GPU layer cost reasonable on TVs.

### Tonearm (SVG)

- Single `<g>` with `transform-origin` at the pivot.
- States: `idle` (raised, ~0°), `playing` (~25°, lowered).
- 0.8s cubic-bezier transition. Headshell counter-rotates to stay parallel.
- Respects `prefers-reduced-motion` (instant snap, no transition).

### Sleeve card

- Square aspect ratio enforced via container; `<img>` uses `object-fit: contain` against a skin-colored mat — never cropped, never overlaid.
- Below the card: track title (bold), artist (regular), small "Listen on Spotify" link with logo.
- The whole card is clickable and opens the track in Spotify.

### Skins

v1 ships **Vintage Oak only**:

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

Skin system is built generically (CSS variables + skin object) so v1.1 can drop in the other 4 (Classic Black, Retro Red, Hi-Fi Silver, Neon Dark) without refactoring scene components.

### Clean mode

- Hides `TrackInfo`, `SkinPicker` trigger, settings affordances.
- **Keeps** `SleeveCard`, `SpotifyAttribution`, and the "Listen on Spotify" link — required by compliance even in display mode.
- Vinyl + tonearm + cabinet + sleeve card stay.
- Toggle: `F` key on desktop, tap-and-hold (1s) on iPad.

### Performance budget

- Canvas redraws bounded by trigger list above, not per-frame.
- Spin is CSS — GPU compositor.
- Target: 60fps on iPad Air.
- No `requestAnimationFrame` loops outside brief track-swap transitions.

## Error Handling & Edge Cases

### Auth

- User denies auth → return to login with friendly message.
- Returned `state` mismatch → reject callback, show "auth was tampered with, please retry."
- Token exchange fails → error + retry button.
- Refresh fails → clear tokens, re-login. No assumed 6-month expiry.

### API

- 401 → silent refresh + single retry; second 401 → re-login.
- 403 → likely unauthorized dev-mode user; explicit screen with "ask Matt to add your Spotify account" guidance.
- 429 → honor `Retry-After`; pause polling.
- Offline → keep last snapshot, show "Reconnecting…" dot, resume on `online` event.
- 500/timeout → TanStack Query's exponential backoff.

### Playback edge cases

- `currently_playing_type === 'ad'` → generic ad state (no sleeve card).
- `currently_playing_type === 'episode'` → use episode images + show name; same compliance rules.
- `currently_playing_type` unknown/future → idle fallback (Spotify explicitly warns clients to expect new types).
- `item.uri === null` (local files) → use composite key (name+artist+albumName) for transitionKey.
- Nothing playing (`item === null`) → idle turntable.
- Rapid skipping → 500ms debounce on visual swap.

### Visual edge cases

- Artwork still loading → vinyl label uses skin's default ring color; sleeve shows skin-colored mat. Crossfade in once loaded.
- Artwork load fails → keep mat; vinyl label uses skin default.
- Tab hidden → pause polling and spin.
- Non-leader tab → no polling; receives broadcast snapshots.
- DPR change (move window between displays) → canvas redraws.

### iPad local-dev limitation (called out explicitly)

`http://127.0.0.1:5173/callback` resolves to the iPad itself, not the Mac dev server. Therefore:

- **Local iPad visual QA uses mocked playback data** (a `?mock=1` URL param wires `usePlayback` to a fixture). Auth flow is not exercised on iPad locally.
- **Real auth + live playback on iPad** is tested only against the deployed Vercel URL (HTTPS, stable custom domain — not preview URLs, which have ephemeral hostnames Spotify won't accept without re-registering).

### Vercel deployment

- **Stable custom domain** registered as the prod redirect URI in Spotify (e.g., `https://vinyl.<domain>/callback`). Preview deployments use mocked data only — their URLs change per-deploy and aren't worth registering.
- `vercel.json` SPA fallback rewrite so `/callback` (and any client route) returns `index.html`.

### Explicit non-handling (v1)

- Multiple Spotify accounts / switching.
- Showing devices / transferring playback.
- Offline beyond "show last state."
- Lyrics, queue, search.
- Skin switching UI (only one skin exists).

## Testing Strategy

| Layer | Approach | Tool |
|---|---|---|
| PKCE + state helpers | Unit, pure functions | Vitest |
| Token store | Unit — set/get/clear, isolation | Vitest |
| Spotify client | Unit with mocked fetch — 401 refresh+retry, 429 Retry-After, 403, network error | Vitest + MSW |
| `normalize` + `deriveTurntableState` | Unit — track/episode/ad/unknown/local-file, transitionKey stability | Vitest |
| `usePlayback` | Hook test — pauses on hidden, resumes on visible, tab leader logic | Vitest + RTL |
| Palette extraction | Unit with fixture images | Vitest |
| UI store | Unit — skin switch, clean mode | Vitest |
| Scene components | Smoke — renders given each `TurntableState` kind | RTL |
| **Visual regression** | Playwright screenshots at desktop (1440×900) and iPad (1024×768, 820×1180) for: idle, playing-track, playing-episode, ad, paused, clean-mode, loading-artwork | Playwright |
| **OAuth + API E2E (mocked)** | Playwright with MSW: callback success, denied auth, state mismatch, 401 refresh, 403 unauthorized, 429 Retry-After, offline, episode response, ad response, local-file response | Playwright + MSW |
| Vinyl canvas pixel smoke | Render with fixture artwork, sample center pixel matches expected palette | Playwright |
| Tonearm transitions | Visual regression covers it; no unit tests | — |

### Skipped intentionally

- E2E against real Spotify (requires live account; mocked E2E covers protocol).
- Performance benchmarks (subjective; eyeball on iPad).

### Manual QA checklist (pre-deploy)

1. Fresh login flow on Mac browser (real Spotify).
2. Play/pause/skip on phone → visuals react within 3s.
3. Vintage Oak skin renders cleanly with multiple albums (varied palettes).
4. Clean mode hides chrome via `F` key but **sleeve card + Spotify attribution remain visible**.
5. Tab-hidden pauses polling (DevTools network).
6. Two tabs open → only one polls (tab leader works).
7. iPad mock-data view (`?mock=1`) renders correctly on Safari over LAN.
8. After Vercel deploy: real auth + playback on iPad against custom domain; Add to Home Screen launches fullscreen PWA.

## Deployment

- **Dev:** `npm run dev` on MacBook → `http://127.0.0.1:5173`. Mac browser exercises full auth flow. iPad uses `?mock=1` over LAN.
- **Prod:** Vercel auto-deploy from `main` to stable custom domain. `vercel.json` SPA fallback configured.
- **Spotify Redirect URIs registered:**
  - `http://127.0.0.1:5173/callback` (dev)
  - `https://<stable-custom-domain>/callback` (prod)

## Security

- Tokens in `sessionStorage` only, accessed exclusively via `tokenStore`. Not "secure" — just less persistent than `localStorage`. Any XSS still wins, so:
  - Strict CSP via `<meta>` (no inline scripts, no third-party origins beyond Spotify CDN for artwork).
  - No third-party analytics or runtime scripts.
  - `history.replaceState` after callback to strip `?code=` from history/URL.
- Real logout: clears tokens, verifier, state, palette cache, and broadcasts to other tabs.
- `state` parameter validated on callback (CSRF protection).

## Spotify App

- **Client ID:** `e9fceabcee074982bb372ca66e7f0b0c`
- **Scopes:** `user-read-currently-playing` (least-privilege).
- **APIs enabled in dashboard:** Web API. Web Playback SDK left enabled but unused in v1.
- **Mode:** Development. **Up to 5 Premium users** (Spotify policy as of Feb 2026 update). All authorized users must have Spotify Premium.

## v1.1 Roadmap (deferred, captured for context)

- Skins: Classic Black, Retro Red, Hi-Fi Silver, Neon Dark + skin picker UI.
- Lyrics overlay (Genius or Musixmatch).
- Audio visualizer (Web Audio API, where playback is in-tab).
- Song info panel (album tracklist, release year, etc.).
- Reconsider Path B (album art on label) only if/when staying personal-use indefinitely.
