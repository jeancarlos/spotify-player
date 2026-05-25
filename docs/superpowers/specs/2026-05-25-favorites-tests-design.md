# Favorites Test Coverage — Design Spec

**Date:** 2026-05-25
**Scope:** Unit tests for all favorites components + E2E for the full favorites flow

---

## Context

The favorites feature lets users add Spotify tracks to a local + Spotify-synced playlist. Key parts:

- `useSpoterPlaylist` — orchestrates lazy playlist creation, add/remove sync
- `useFavoriteStorage` — localStorage + cookie persistence layer
- `useIsTrackFavorite` — reactive `useSyncExternalStore` hook
- `AddFavoriteForm` — form with track autocomplete + note field
- `TrackAutocomplete` — combobox with debounced search + keyboard nav
- `FavoriteButton` — heart button in MiniPlayer
- `Favorites` page — list view with add/remove

After the lazy-creation refactor, `useSpoterPlaylist` no longer auto-creates a playlist on mount. Creation is triggered by the first `addTrack` call.

---

## Unit Test Design

**Approach:** Heavy mocking via `vi.mock()`. Each file tests one unit in isolation. No real HTTP calls.

### 1. `src/hooks/__tests__/useSpoterPlaylist.test.ts` — Update + expand

Keep existing 5 scenarios (find by name, localStorage init, addTrack, dedup, removeTrack).

Add:
- `createPlaylist.mutate` is called on first `addTrack` when no `playlistId` exists
- `addMutation.mutate` is called with the new playlist id after creation succeeds
- Subsequent `addTrack` calls use the existing `playlistId` without calling `createPlaylist.mutate` again

### 2. `src/components/favorites/__tests__/AddFavoriteForm.test.tsx` — New

Mock: `useTranslation`, `TrackAutocomplete` (controlled stub), nothing else (Zod + react-hook-form run real).

Scenarios:
- Submit button is disabled when no track is selected
- Submit button is disabled when selected track is already in favorites
- Warning "already in favorites" appears when selected track is in `existingFavorites`
- Submitting a valid track calls `onAdd(track, note)` and `onClose`
- Submitting with empty note calls `onAdd(track, undefined)`
- Note character counter reflects typed length
- Note over 80 chars shows validation error and disables submit

### 3. `src/components/favorites/__tests__/TrackAutocomplete.test.tsx` — New

Mock: `useSearchTracks`, `useDebounce` (pass-through or fake timer), `useTranslation`.

Scenarios:
- Renders combobox input with correct placeholder
- Results list appears after typing ≥2 chars (mock returns tracks)
- Keyboard arrow/enter navigation selects item and calls `onChange`
- Clicking a result calls `onChange` with the track
- When `value` is set, renders `SelectedTrack` instead of input
- Clear button calls `onChange(null)` and re-focuses input

### 4. `src/components/layout/mini-player/__tests__/FavoriteButton.test.tsx` — New

Mock: `usePlayer`, `useToast`, `useTranslation`.

Scenarios:
- Returns null when `currentTrack` is null
- Renders heart button when `currentTrack` is set
- Click when `isSaved=false` calls `addTrack(currentTrack)` and fires toast
- Click when `isSaved=true` calls `removeTrack(currentTrack.uri)` and fires toast
- `aria-label` reflects saved state

### 5. `src/hooks/__tests__/useIsTrackFavorite.test.ts` — New

Uses real `useSyncExternalStore` + fake localStorage.

Scenarios:
- Returns `false` when `uri` is null or undefined
- Returns `false` when `userId` is empty
- Returns `false` when track not in localStorage
- Returns `true` when track exists in localStorage
- Updates reactively when `spoter:favorites-changed` event is dispatched

### 6. `src/hooks/__tests__/useFavoriteStorage.test.ts` — New

Real implementation + fake localStorage.

Scenarios:
- `addTrack` adds track to list and dispatches `spoter:favorites-changed`
- `addTrack` ignores duplicate uri (idempotent)
- `addTrack` with note stores it in notes map
- `removeTrack` removes by uri and dispatches event
- `replaceTracks` replaces entire list
- Hook re-reads localStorage when `spoter:favorites-changed` fires from another tab

### 7. `src/pages/__tests__/Favorites.test.tsx` — New

Mock: `useSpoterPlaylist`, `usePlayer`, `usePlayTrack`, `useTranslation`.

Scenarios:
- Shows `EmptyState` when `tracks` is empty and `isLoading` is false
- Shows `TrackRowSkeleton` when `isLoading` is true
- Renders one row per track when `tracks` is populated
- AddButton click opens the popover (aria-expanded changes)
- Clicking the open AddButton again closes the popover

---

## E2E Test Design

**Approach:** Playwright + `page.route()` mocks. Extend global fixture, keep existing 5 scenarios, add new ones.

### Fixture changes — `tests-e2e/fixtures/auth.ts`

In `setupApiRoutes`, add handling for `type=track` in the search mock. Return `mockTracks` filtered by query. Existing artist/album/playlist handling is unchanged.

### New E2E scenarios — `tests-e2e/favorites.spec.ts`

**Full add flow:**
1. Navigate to `/favorites`
2. Click "Add favorite"
3. Type "Mock" in the combobox → mock returns `mockTracks`
4. Click the first result
5. Type a note
6. Click "Add to favorites"
7. Assert: track name appears in the favorites list

**Remove flow:**
1. Pre-populate localStorage with one track via `addInitScript`
2. Navigate to `/favorites`
3. Assert: track is visible
4. Interact with remove button on `TrackRow`
5. Assert: track disappears from list

**Empty state:**
1. Navigate to `/favorites` with empty localStorage
2. Assert: `EmptyState` message is visible, no track rows

**MiniPlayer heart button:**
1. Override `me/player` route to return a currently playing track
2. Navigate to home or any page
3. Assert: heart button is visible in MiniPlayer
4. Click heart → Assert: heart fills (isSaved=true) or toast appears

---

## Implementation Order

1. Unit tests (parallel subagents — each file independent)
2. Fixture update + E2E expansion (sequential — fixture first)
3. `yarn test` → fix failures
4. `yarn test:e2e` → fix failures

---

## Constraints

- No real HTTP calls in unit tests
- E2E never touches real Spotify API
- `vi.mock()` declarations before imports (Vitest hoisting)
- Test descriptions in Portuguese (consistent with existing tests)
