# E2E Tests + Lint/Quality Gate — Design Spec

**Date:** 2026-05-24
**Scope:** Playwright E2E tests covering all functional requirements + eslint/prettier quality gate

---

## 1. Motivation

The project has defined functional requirements for evaluation. E2E tests prove each requirement works from the user's perspective. Separately, the codebase has 74 lint errors introduced by upgrading to `strictTypeChecked` — these need to be resolved before tests are written so the baseline is clean.

---

## 2. Quality Gate (lint + format + build)

### 2.1 ESLint changes

**`complexity` rule:** Set globally to `max: 10` — industry consensus for React codebases. No per-directory override; page components with complexity > 10 need real decomposition, not a relaxed limit.

**`tests-e2e/**` in global ignores:** Remove. Move to the existing test-files override block so E2E tests are linted with the same relaxed rules as unit tests (no `no-explicit-any`, no `promise-function-async`, etc.).

**`playwright.config.ts` and `vite.config.ts`:** Keep in ignores — they use Node.js globals and ESM patterns that conflict with the browser-targeted TS config.

### 2.2 Component decomposition required

These files violate `complexity: 10` and must be refactored:

| File | Current complexity | Target approach |
|---|---|---|
| `Artists.tsx` | 26 | Extract `useArtistsSearch` hook + `<ArtistGrid>` + `<ArtistFilters>` |
| `AlbumDetail.tsx` | 16 / 15 | Extract track table logic to hook or subcomponent |
| `PlaylistDetail.tsx` | 15 | Same pattern as AlbumDetail |
| `ArtistDetail.tsx` | 14 | Extract tabs/section logic |
| `Home.tsx` | 11 | Extract one section to subcomponent |
| `Favorites.tsx` | 10 | At limit — review, likely fine |
| `lib/axios.ts` | 10 | At limit — review error handler, may need split |

Fix also: `no-unnecessary-condition` (1 error) and `no-nested-ternary` in `Artists.tsx:89`.

### 2.3 Prettier

Config already correct: `semi: false`, `singleQuote: true`, `trailingComma: es5`, `printWidth: 100`, `tabWidth: 2`. Run `yarn format` after refactoring.

### 2.4 Sequence

```
1. Update eslint.config.mjs  (complexity: 10, move tests-e2e out of ignores)
2. Refactor violating components (see table above)
3. yarn format
4. yarn lint  (must pass 0 errors, 0 warnings)
5. yarn build (must succeed)
```

---

## 3. E2E Test Architecture

### 3.1 Strategy

- **Runner:** Playwright (already configured, `baseURL: http://localhost:5173`)
- **Auth:** `page.route()` to intercept all `api.spotify.com` calls — no real OAuth, no MSW service worker
- **Scope:** Golden path per feature — prove each requirement works, no error-state variants
- **Browsers:** Chromium only during development; full matrix (Firefox, WebKit, Mobile) on CI

### 3.2 File structure

```
tests-e2e/
├── fixtures/
│   ├── mock-data.ts       ← shared Artist, Track, Album objects
│   └── auth.ts            ← test.extend() with page.route() pre-configured
├── smoke.spec.ts          ← existing (keep, no changes)
├── artists.spec.ts        ← REQ: listing, pagination, filter by name/album
├── artist-detail.spec.ts  ← REQ: detail page, top tracks table, chart
├── favorites.spec.ts      ← REQ: form, LocalStorage persistence, validation
└── i18n.spec.ts           ← REQ: PT/EN translation on authenticated pages
```

### 3.3 Auth fixture design

`fixtures/auth.ts` exports a `test` created with `test.extend()`. The fixture's `page` automatically intercepts:

- `**/api.spotify.com/v1/me` → mock user object
- `**/api.spotify.com/v1/me/top/artists` → paged artist list (40 items for pagination tests)
- `**/api.spotify.com/v1/search*` → artist or album results based on `type` param
- `**/api.spotify.com/v1/artists/:id` → single artist
- `**/api.spotify.com/v1/artists/:id/top-tracks` → track list
- `**/api.spotify.com/v1/artists/:id/albums` → album list
- `**/api.spotify.com/v1/audio-features` → radar chart data

The fixture also injects a fake `access_token` into `localStorage` before navigation so the app's auth guard passes.

### 3.4 Test coverage per file

**`artists.spec.ts`**
- Artist cards render with name and image (not a `<table>`)
- Page shows 20 items per page
- "Next page" button loads page 2
- Search by artist name filters results
- Switching filter to "album" and searching returns album results

**`artist-detail.spec.ts`**
- Clicking an artist card navigates to `/artist/:id`
- Detail page displays artist name, genre tags, follower count
- Top tracks table is visible with track name and duration columns
- Table has pagination controls
- Chart element (canvas or SVG) is present on the page

**`favorites.spec.ts`**
- Favorites page renders the form with required fields
- Submitting a valid entry saves it to `localStorage`
- Saved entry appears in the favorites list after submission
- Submitting with empty required fields shows validation error messages

**`i18n.spec.ts`** (extends smoke.spec.ts coverage)
- PT/EN toggle works on the artists listing page (authenticated)
- PT/EN toggle works on the artist detail page

### 3.5 Mock data design

`mock-data.ts` exports typed constants matching `src/types/spotify` — same shape as `src/mocks/handlers.ts` but standalone (no MSW dependency). Includes 40 artists for pagination testing (page size = 20).

---

## 4. Acceptance Criteria

- [ ] `yarn lint` passes with 0 errors and 0 warnings
- [ ] `yarn build` succeeds
- [ ] All 5 new spec files exist under `tests-e2e/`
- [ ] `yarn test:e2e` passes on Chromium
- [ ] Each functional requirement from the brief maps to at least one passing test
- [ ] No component in `src/` has cyclomatic complexity > 10

---

## 5. Out of scope

- Error state / API failure tests (golden path only)
- Accessibility checks (axe-core)
- Visual regression tests
- Firefox / WebKit / Mobile runs (CI only)
- New Spotify API features beyond current pages
