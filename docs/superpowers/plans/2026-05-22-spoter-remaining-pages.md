# Spoter — Remaining Pages + Bug Fixes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 3 known bugs in the existing code, then implement all remaining spec pages: Artists listing, Artist Detail, Favorites, Profile, MiniPlayer full controls, and Fullscreen Player with lyrics.

**Architecture:** All new pages plug into the existing AppShell router as children of the protected shell. Contexts (Auth, UI, Player) are already wired. New hooks follow the established React Query + Axios pattern in `src/hooks/queries/`. Favorites uses a standalone `useFavorites` hook with `useReducer` + localStorage (no React Query). Fullscreen Player is a Framer Motion overlay rendered inside AppShell, controlled by `PlayerContext.isFullscreen`.

**Tech Stack:** React 18 + TS 6, React Router v6, TanStack Query v5, Axios, Framer Motion, Recharts, React Hook Form + Zod, react-i18next, Vitest + Testing Library, MSW 2

**Prerequisite:** The `2026-05-22-spoter-infra-home.md` plan must be fully complete (33 tests passing, Home page working). This plan picks up where it left off.

---

## File Map

```
src/
├── types/
│   └── spotify.ts                    ← modify: add AudioFeatures, SearchResponse, TopTracksResponse, AlbumsResponse
├── lib/
│   └── colorThief.ts                 ← fix: return "r,g,b" format instead of "rgb(r,g,b)"
├── hooks/
│   ├── useDebounce.ts                ← create
│   ├── useFavorites.ts               ← create
│   └── queries/
│       ├── useArtists.ts             ← create
│       ├── useSearchAlbums.ts        ← create
│       ├── useArtist.ts              ← create
│       ├── useArtistTopTracks.ts     ← create
│       ├── useArtistAlbums.ts        ← create
│       ├── useUserTopItems.ts        ← create
│       ├── useAudioFeatures.ts       ← create (multiple track IDs)
│       ├── useNowPlaying.ts          ← create
│       └── useLyrics.ts              ← create
├── mocks/
│   └── handlers.ts                   ← modify: add handlers for all new endpoints
├── components/
│   ├── shared/
│   │   ├── TrackRow.tsx              ← create
│   │   └── ArtistCard.tsx            ← create
│   └── layout/
│       ├── MiniPlayer.tsx            ← replace: add full controls
│       └── FullscreenPlayer.tsx      ← create
├── pages/
│   ├── Home.tsx                      ← fix: wrap handlePlay in useCallback
│   ├── Artists.tsx                   ← create
│   ├── ArtistDetail.tsx              ← create
│   ├── Favorites.tsx                 ← create
│   └── Profile.tsx                   ← create
├── components/layout/
│   └── DynamicBackground.tsx         ← fix: use rgba() not ${color}55
├── router.tsx                        ← modify: add all new routes
└── App.css                           ← delete (dead Vite boilerplate)

tsconfig.app.json                     ← fix: add ignoreDeprecations
```

---

### Task 1: Bug Fixes

**Files:**
- Modify: `tsconfig.app.json`
- Modify: `src/lib/colorThief.ts`
- Modify: `src/components/layout/DynamicBackground.tsx`
- Modify: `src/pages/Home.tsx`
- Delete: `src/App.css`

- [ ] **Step 1: Fix tsconfig.app.json — TS 6 deprecation**

Open `tsconfig.app.json`. Add `"ignoreDeprecations": "6.0"` inside `"compilerOptions"`:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023", "DOM"],
    "module": "esnext",
    "types": ["vite/client"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "ignoreDeprecations": "6.0",
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 2: Fix colorThief.ts — return raw r,g,b strings**

Replace `src/lib/colorThief.ts`:

```typescript
// src/lib/colorThief.ts
// Returns colors as "r,g,b" (no wrapper) so callers can use rgba(${color},alpha) in CSS.
export async function extractPalette(imageUrl: string): Promise<[string, string] | null> {
  try {
    const { default: ColorThief } = await import('color-thief-ts')
    const img = new Image()
    img.crossOrigin = 'anonymous'

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = imageUrl
    })

    const thief = new ColorThief()
    const palette = thief.getPalette(img, 2) as number[][]

    return [
      `${palette[0][0]},${palette[0][1]},${palette[0][2]}`,
      `${palette[1][0]},${palette[1][1]},${palette[1][2]}`,
    ]
  } catch {
    return null
  }
}
```

- [ ] **Step 3: Fix DynamicBackground.tsx — use rgba() instead of ${color}55**

Replace `src/components/layout/DynamicBackground.tsx`:

```tsx
// src/components/layout/DynamicBackground.tsx
import { motion } from 'framer-motion'
import { usePlayer } from '@/hooks/usePlayer'

export function DynamicBackground() {
  const { state } = usePlayer()
  const { palette, isPlaying } = state

  const [primary, secondary] = palette ?? ['45,27,105', '22,33,62']

  const gradient = isPlaying
    ? `radial-gradient(ellipse at 20% 50%, rgba(${primary},0.33) 0%, transparent 55%),
       radial-gradient(ellipse at 80% 50%, rgba(${secondary},0.33) 0%, transparent 55%),
       rgb(10,10,15)`
    : `radial-gradient(ellipse at 50% 50%, rgba(45,27,105,0.2) 0%, transparent 65%),
       rgb(10,10,15)`

  return (
    <motion.div
      className="fixed inset-0 -z-10"
      animate={{ background: gradient }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'url(/noise.svg)', backgroundSize: '200px 200px' }}
      />
    </motion.div>
  )
}
```

- [ ] **Step 4: Fix Home.tsx — wrap handlePlay in useCallback**

Replace `src/pages/Home.tsx`:

```tsx
// src/pages/Home.tsx
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useRecentlyPlayed } from '@/hooks/queries/useRecentlyPlayed'
import { useNewReleases } from '@/hooks/queries/useNewReleases'
import { useUserTopArtists } from '@/hooks/queries/useUserTopArtists'
import { useRecommendations } from '@/hooks/queries/useRecommendations'
import { SectionRow } from '@/components/shared/SectionRow'
import { TrackCard } from '@/components/shared/TrackCard'
import { AlbumCard } from '@/components/shared/AlbumCard'
import { usePlayer } from '@/hooks/usePlayer'
import { extractPalette } from '@/lib/colorThief'
import type { SpotifyTrack } from '@/types/spotify'

export function Home() {
  const { t } = useTranslation()
  const { dispatch } = usePlayer()

  const recentlyPlayed = useRecentlyPlayed(20)
  const newReleases = useNewReleases(20)
  const topArtists = useUserTopArtists('short_term', 5)
  const seedIds = topArtists.data?.map(a => a.id) ?? []
  const recommendations = useRecommendations(seedIds, 20)

  const handlePlay = useCallback(
    async (track: SpotifyTrack) => {
      dispatch({ type: 'SET_TRACK', payload: track })
      dispatch({ type: 'TOGGLE_PLAY' })
      const imageUrl = track.album.images[0]?.url
      if (imageUrl) {
        const palette = await extractPalette(imageUrl)
        if (palette) dispatch({ type: 'SET_PALETTE', payload: palette })
      }
    },
    [dispatch]
  )

  return (
    <div className="p-6 space-y-8 min-h-full">
      <SectionRow title={t('home.recentlyPlayed')} isLoading={recentlyPlayed.isPending}>
        {recentlyPlayed.data?.map(item => (
          <TrackCard key={item.played_at} track={item.track} onPlay={handlePlay} />
        ))}
      </SectionRow>

      <SectionRow
        title={t('home.newReleases')}
        seeMoreHref="/artists"
        isLoading={newReleases.isPending}
      >
        {newReleases.data?.map(album => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </SectionRow>

      <SectionRow
        title={t('home.recommendations')}
        isLoading={recommendations.isPending || topArtists.isPending}
      >
        {recommendations.data?.map(track => (
          <TrackCard key={track.id} track={track} onPlay={handlePlay} />
        ))}
      </SectionRow>
    </div>
  )
}
```

- [ ] **Step 5: Delete dead file App.css**

```bash
rm src/App.css
```

- [ ] **Step 6: Verify build passes**

```bash
npm run build
# Expected: no errors
npm run test
# Expected: 33 tests pass
```

- [ ] **Step 7: Commit**

```bash
git add tsconfig.app.json src/lib/colorThief.ts src/components/layout/DynamicBackground.tsx src/pages/Home.tsx
git rm src/App.css
git commit -m "fix: correção do build TS6, DynamicBackground rgba, useCallback no handlePlay"
```

---

### Task 2: New Spotify Types

**Files:**
- Modify: `src/types/spotify.ts`

- [ ] **Step 1: Add missing types to spotify.ts**

Append to the end of `src/types/spotify.ts`:

```typescript
// Append to src/types/spotify.ts

export interface AudioFeatures {
  id: string
  danceability: number   // 0-1
  energy: number         // 0-1
  valence: number        // 0-1
  acousticness: number   // 0-1
  speechiness: number    // 0-1
  instrumentalness: number
  liveness: number
  loudness: number
  tempo: number
  duration_ms: number
  key: number
  mode: number
  time_signature: number
}

export interface SearchArtistsResponse {
  artists: PagingObject<SpotifyArtist>
}

export interface SearchAlbumsResponse {
  albums: PagingObject<SpotifyAlbumSimple>
}

export interface ArtistTopTracksResponse {
  tracks: SpotifyTrack[]
}

export interface ArtistAlbumsResponse extends PagingObject<SpotifyAlbumSimple> {}

export interface PlayerState {
  is_playing: boolean
  progress_ms: number | null
  item: SpotifyTrack | null
  repeat_state: 'off' | 'track' | 'context'
  shuffle_state: boolean
}

export interface TopItemsResponse<T> extends PagingObject<T> {}
```

- [ ] **Step 2: Verify TypeScript still happy**

```bash
npx tsc -p tsconfig.app.json --noEmit
# Expected: no errors
```

- [ ] **Step 3: Commit**

```bash
git add src/types/spotify.ts
git commit -m "feat: adicionar tipos AudioFeatures, Search, ArtistTopTracks, PlayerState"
```

---

### Task 3: New Data Hooks

**Files:**
- Create: `src/hooks/useDebounce.ts`
- Create: `src/hooks/queries/useArtists.ts`
- Create: `src/hooks/queries/useSearchAlbums.ts`
- Create: `src/hooks/queries/useArtist.ts`
- Create: `src/hooks/queries/useArtistTopTracks.ts`
- Create: `src/hooks/queries/useArtistAlbums.ts`
- Create: `src/hooks/queries/useUserTopItems.ts`
- Create: `src/hooks/queries/useAudioFeatures.ts`
- Create: `src/hooks/queries/useNowPlaying.ts`
- Create: `src/hooks/queries/useLyrics.ts`

- [ ] **Step 1: Write useDebounce.ts**

```typescript
// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}
```

- [ ] **Step 2: Write useArtists.ts**

```typescript
// src/hooks/queries/useArtists.ts
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SearchArtistsResponse, SpotifyArtist } from '@/types/spotify'

export function useArtists(query: string, page: number, limit = 20) {
  return useQuery<SpotifyArtist[]>({
    queryKey: ['artists-search', query, page],
    enabled: query.trim().length > 0,
    queryFn: async () => {
      const { data } = await api.get<SearchArtistsResponse>('/search', {
        params: { q: query, type: 'artist', limit, offset: (page - 1) * limit },
      })
      return data.artists.items
    },
  })
}
```

- [ ] **Step 3: Write useSearchAlbums.ts**

```typescript
// src/hooks/queries/useSearchAlbums.ts
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SearchAlbumsResponse, SpotifyAlbumSimple } from '@/types/spotify'

export function useSearchAlbums(query: string, page: number, limit = 20) {
  return useQuery<SpotifyAlbumSimple[]>({
    queryKey: ['albums-search', query, page],
    enabled: query.trim().length > 0,
    queryFn: async () => {
      const { data } = await api.get<SearchAlbumsResponse>('/search', {
        params: { q: query, type: 'album', limit, offset: (page - 1) * limit },
      })
      return data.albums.items
    },
  })
}
```

- [ ] **Step 4: Write useArtist.ts**

```typescript
// src/hooks/queries/useArtist.ts
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SpotifyArtist } from '@/types/spotify'

export function useArtist(id: string) {
  return useQuery<SpotifyArtist>({
    queryKey: ['artist', id],
    queryFn: async () => {
      const { data } = await api.get<SpotifyArtist>(`/artists/${id}`)
      return data
    },
  })
}
```

- [ ] **Step 5: Write useArtistTopTracks.ts**

```typescript
// src/hooks/queries/useArtistTopTracks.ts
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { ArtistTopTracksResponse, SpotifyTrack } from '@/types/spotify'

export function useArtistTopTracks(artistId: string) {
  return useQuery<SpotifyTrack[]>({
    queryKey: ['artist-top-tracks', artistId],
    queryFn: async () => {
      const { data } = await api.get<ArtistTopTracksResponse>(
        `/artists/${artistId}/top-tracks`,
        { params: { market: 'BR' } }
      )
      return data.tracks
    },
  })
}
```

- [ ] **Step 6: Write useArtistAlbums.ts**

```typescript
// src/hooks/queries/useArtistAlbums.ts
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SpotifyAlbumSimple, PagingObject } from '@/types/spotify'

export function useArtistAlbums(artistId: string, page: number, limit = 10) {
  return useQuery<PagingObject<SpotifyAlbumSimple>>({
    queryKey: ['artist-albums', artistId, page],
    queryFn: async () => {
      const { data } = await api.get<PagingObject<SpotifyAlbumSimple>>(
        `/artists/${artistId}/albums`,
        { params: { limit, offset: (page - 1) * limit, include_groups: 'album,single', market: 'BR' } }
      )
      return data
    },
  })
}
```

- [ ] **Step 7: Write useUserTopItems.ts**

```typescript
// src/hooks/queries/useUserTopItems.ts
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SpotifyTrack, SpotifyArtist, TopItemsResponse } from '@/types/spotify'

type TimeRange = 'short_term' | 'medium_term' | 'long_term'

export function useUserTopTracks(timeRange: TimeRange = 'short_term', limit = 10) {
  return useQuery<SpotifyTrack[]>({
    queryKey: ['top-tracks', timeRange, limit],
    queryFn: async () => {
      const { data } = await api.get<TopItemsResponse<SpotifyTrack>>('/me/top/tracks', {
        params: { time_range: timeRange, limit },
      })
      return data.items
    },
  })
}

export function useUserTopArtistsFull(timeRange: TimeRange = 'short_term', limit = 10) {
  return useQuery<SpotifyArtist[]>({
    queryKey: ['top-artists-full', timeRange, limit],
    queryFn: async () => {
      const { data } = await api.get<TopItemsResponse<SpotifyArtist>>('/me/top/artists', {
        params: { time_range: timeRange, limit },
      })
      return data.items
    },
  })
}
```

- [ ] **Step 8: Write useAudioFeatures.ts**

```typescript
// src/hooks/queries/useAudioFeatures.ts
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { AudioFeatures } from '@/types/spotify'

interface AudioFeaturesResponse {
  audio_features: AudioFeatures[]
}

export function useAudioFeatures(trackIds: string[]) {
  return useQuery<AudioFeatures[]>({
    queryKey: ['audio-features', trackIds],
    enabled: trackIds.length > 0,
    queryFn: async () => {
      const { data } = await api.get<AudioFeaturesResponse>('/audio-features', {
        params: { ids: trackIds.join(',') },
      })
      return data.audio_features.filter(Boolean)
    },
  })
}
```

- [ ] **Step 9: Write useNowPlaying.ts**

```typescript
// src/hooks/queries/useNowPlaying.ts
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { PlayerState } from '@/types/spotify'

export function useNowPlaying() {
  return useQuery<PlayerState | null>({
    queryKey: ['now-playing'],
    queryFn: async () => {
      const { data, status } = await api.get<PlayerState>('/me/player')
      if (status === 204) return null
      return data
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  })
}
```

- [ ] **Step 10: Write useLyrics.ts**

```typescript
// src/hooks/queries/useLyrics.ts
import { useQuery } from '@tanstack/react-query'

export function useLyrics(artist: string, title: string) {
  return useQuery<string | null>({
    queryKey: ['lyrics', artist, title],
    enabled: !!artist && !!title,
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
      )
      if (!res.ok) return null
      const data = (await res.json()) as { lyrics?: string; error?: string }
      return data.lyrics ?? null
    },
  })
}
```

- [ ] **Step 11: Commit**

```bash
git add src/hooks/
git commit -m "feat: adicionar hooks useDebounce, busca de artistas/álbuns, top items, audio features, now playing, lyrics"
```

---

### Task 4: useFavorites Hook (TDD)

**Files:**
- Create: `src/hooks/__tests__/useFavorites.test.ts`
- Create: `src/hooks/useFavorites.ts`

- [ ] **Step 1: Write useFavorites tests**

```typescript
// src/hooks/__tests__/useFavorites.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFavorites } from '../useFavorites'

beforeEach(() => {
  localStorage.clear()
})

describe('useFavorites', () => {
  it('starts with empty list', () => {
    const { result } = renderHook(() => useFavorites())
    expect(result.current.favorites).toHaveLength(0)
  })

  it('adds a favorite and persists to localStorage', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.add({ title: 'Track 1', artist: 'Artist 1', album: 'Album 1', note: '' })
    })
    expect(result.current.favorites).toHaveLength(1)
    expect(result.current.favorites[0].title).toBe('Track 1')
    const stored = JSON.parse(localStorage.getItem('spoter_favorites') ?? '[]') as unknown[]
    expect(stored).toHaveLength(1)
  })

  it('removes a favorite by id', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.add({ title: 'Track 1', artist: 'Artist 1' })
    })
    const id = result.current.favorites[0].id
    act(() => {
      result.current.remove(id)
    })
    expect(result.current.favorites).toHaveLength(0)
  })

  it('searches favorites by title', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.add({ title: 'Bohemian Rhapsody', artist: 'Queen' })
      result.current.add({ title: 'Stairway to Heaven', artist: 'Led Zeppelin' })
    })
    expect(result.current.search('Bohemian')).toHaveLength(1)
    expect(result.current.search('Bohemian')[0].title).toBe('Bohemian Rhapsody')
  })

  it('search is case-insensitive and matches artist too', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.add({ title: 'Comfortably Numb', artist: 'Pink Floyd' })
    })
    expect(result.current.search('pink floyd')).toHaveLength(1)
  })

  it('rehydrates from localStorage on mount', () => {
    const stored = [
      { id: 'abc-123', title: 'Stored Track', artist: 'Stored Artist', createdAt: new Date().toISOString() },
    ]
    localStorage.setItem('spoter_favorites', JSON.stringify(stored))
    const { result } = renderHook(() => useFavorites())
    expect(result.current.favorites[0].title).toBe('Stored Track')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/hooks/__tests__/useFavorites.test.ts
# Expected: FAIL - Cannot find module '../useFavorites'
```

- [ ] **Step 3: Implement useFavorites.ts**

```typescript
// src/hooks/useFavorites.ts
import { useReducer, useEffect } from 'react'
import { v4 as uuid } from 'uuid'
import type { FavoriteTrack, FavoriteTrackForm } from '@/types/favorites'

const STORAGE_KEY = 'spoter_favorites'

type Action =
  | { type: 'ADD'; payload: FavoriteTrack }
  | { type: 'REMOVE'; id: string }

function reducer(state: FavoriteTrack[], action: Action): FavoriteTrack[] {
  switch (action.type) {
    case 'ADD':
      return [action.payload, ...state]
    case 'REMOVE':
      return state.filter(f => f.id !== action.id)
    default:
      return state
  }
}

function loadFromStorage(): FavoriteTrack[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as FavoriteTrack[]
  } catch {
    return []
  }
}

export function useFavorites() {
  const [favorites, dispatch] = useReducer(reducer, undefined, loadFromStorage)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
  }, [favorites])

  function add(form: FavoriteTrackForm) {
    dispatch({
      type: 'ADD',
      payload: { id: uuid(), ...form, createdAt: new Date().toISOString() },
    })
  }

  function remove(id: string) {
    dispatch({ type: 'REMOVE', id })
  }

  function search(query: string): FavoriteTrack[] {
    const q = query.toLowerCase()
    return favorites.filter(
      f =>
        f.title.toLowerCase().includes(q) ||
        f.artist.toLowerCase().includes(q) ||
        f.album?.toLowerCase().includes(q)
    )
  }

  return { favorites, add, remove, search }
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/hooks/__tests__/useFavorites.test.ts
# Expected: PASS - 6 tests
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useFavorites.ts src/hooks/__tests__/useFavorites.test.ts
git commit -m "feat: adicionar hook useFavorites com useReducer + localStorage e testes"
```

---

### Task 5: MSW Handlers Update + ArtistCard + TrackRow

**Files:**
- Modify: `src/mocks/handlers.ts`
- Create: `src/components/shared/ArtistCard.tsx`
- Create: `src/components/shared/TrackRow.tsx`

- [ ] **Step 1: Update MSW handlers with new endpoints**

Replace `src/mocks/handlers.ts`:

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'
import type {
  SpotifyTrack, SpotifyArtistSimple, SpotifyAlbumSimple, SpotifyArtist,
} from '@/types/spotify'

const artistSimple: SpotifyArtistSimple = { id: 'a1', name: 'Mock Artist', uri: 'spotify:artist:a1', type: 'artist' }
const album: SpotifyAlbumSimple = {
  id: 'al1', name: 'Mock Album', images: [{ url: 'https://picsum.photos/300', width: 300, height: 300 }],
  release_date: '2024-01-01', album_type: 'album', artists: [artistSimple], uri: 'spotify:album:al1', type: 'album',
}
const track: SpotifyTrack = {
  id: 't1', name: 'Mock Track 1', duration_ms: 210000, explicit: false, popularity: 80,
  preview_url: null, uri: 'spotify:track:t1', type: 'track', artists: [artistSimple], album,
}
const artist: SpotifyArtist = {
  id: 'a1', name: 'Mock Artist', images: [{ url: 'https://picsum.photos/300', width: 300, height: 300 }],
  genres: ['pop', 'rock'], followers: { total: 150000 }, popularity: 75,
  uri: 'spotify:artist:a1', type: 'artist',
}
const pagingWrapper = <T>(items: T[]) => ({ items, limit: 20, offset: 0, total: items.length, next: null, previous: null })

export const handlers = [
  http.get('https://api.spotify.com/v1/me', () =>
    HttpResponse.json({
      id: 'user1', display_name: 'Test User', email: 'test@test.com',
      images: [], product: 'premium', followers: { total: 10 }, country: 'BR',
    })
  ),
  http.get('https://api.spotify.com/v1/me/player/recently-played', () =>
    HttpResponse.json({
      items: [{ track, played_at: '2024-01-15T12:00:00Z', context: null }],
      limit: 20, cursors: { before: '1', after: '2' }, next: null,
    })
  ),
  http.get('https://api.spotify.com/v1/browse/new-releases', () =>
    HttpResponse.json({ albums: pagingWrapper([album]) })
  ),
  http.get('https://api.spotify.com/v1/me/top/artists', () =>
    HttpResponse.json(pagingWrapper([artist]))
  ),
  http.get('https://api.spotify.com/v1/me/top/tracks', () =>
    HttpResponse.json(pagingWrapper([track]))
  ),
  http.get('https://api.spotify.com/v1/recommendations', () =>
    HttpResponse.json({ tracks: [track] })
  ),
  http.get('https://api.spotify.com/v1/search', ({ request }) => {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    if (type === 'artist') return HttpResponse.json({ artists: pagingWrapper([artist]) })
    return HttpResponse.json({ albums: pagingWrapper([album]) })
  }),
  http.get('https://api.spotify.com/v1/artists/:id', ({ params }) =>
    HttpResponse.json({ ...artist, id: params['id'] as string })
  ),
  http.get('https://api.spotify.com/v1/artists/:id/top-tracks', () =>
    HttpResponse.json({ tracks: [track] })
  ),
  http.get('https://api.spotify.com/v1/artists/:id/albums', () =>
    HttpResponse.json(pagingWrapper([album]))
  ),
  http.get('https://api.spotify.com/v1/audio-features', () =>
    HttpResponse.json({
      audio_features: [{
        id: 't1', danceability: 0.7, energy: 0.8, valence: 0.6,
        acousticness: 0.1, speechiness: 0.05, instrumentalness: 0,
        liveness: 0.1, loudness: -5, tempo: 120,
        duration_ms: 210000, key: 5, mode: 1, time_signature: 4,
      }],
    })
  ),
  http.get('https://api.spotify.com/v1/me/player', () =>
    HttpResponse.json({
      is_playing: false, progress_ms: 0, item: null,
      repeat_state: 'off', shuffle_state: false,
    })
  ),
]
```

- [ ] **Step 2: Write ArtistCard.tsx**

```tsx
// src/components/shared/ArtistCard.tsx
import { useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { formatNumber } from '@/utils/formatNumber'
import type { SpotifyArtist } from '@/types/spotify'

interface ArtistCardProps {
  artist: SpotifyArtist
  onPlay?: (artist: SpotifyArtist) => void
}

export function ArtistCard({ artist, onPlay }: ArtistCardProps) {
  const navigate = useNavigate()
  const image = artist.images[0]?.url

  return (
    <GlassCard className="w-44 flex flex-col gap-2 group" onClick={() => navigate(`/artists/${artist.id}`)}>
      <div className="relative w-full aspect-square rounded-xl overflow-hidden">
        {image ? (
          <img src={image} alt={artist.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-white/10 flex items-center justify-center">
            <span className="text-3xl text-white/30">{artist.name[0]}</span>
          </div>
        )}
        <div
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          onClick={e => { e.stopPropagation(); onPlay?.(artist) }}
        >
          <Play size={28} className="text-white fill-white" />
        </div>
      </div>
      <div className="overflow-hidden">
        <p className="text-xs font-bold truncate">{artist.name}</p>
        <p className="text-xs text-white/40 truncate">
          {artist.genres.slice(0, 2).join(', ') || 'Unknown genre'}
        </p>
        <p className="text-xs text-white/30 mt-1">{formatNumber(artist.followers.total)} followers</p>
      </div>
    </GlassCard>
  )
}
```

- [ ] **Step 3: Write TrackRow.tsx**

Used in Artist Detail's top tracks table. Shows #, album art, title, duration, popularity on hover.

```tsx
// src/components/shared/TrackRow.tsx
import { useState } from 'react'
import { Play } from 'lucide-react'
import { formatDuration } from '@/utils/formatDuration'
import { cn } from '@/lib/utils'
import type { SpotifyTrack } from '@/types/spotify'

interface TrackRowProps {
  track: SpotifyTrack
  index: number
  onPlay?: (track: SpotifyTrack) => void
}

export function TrackRow({ track, index, onPlay }: TrackRowProps) {
  const [hovered, setHovered] = useState(false)
  const image = track.album.images[0]?.url

  return (
    <div
      className={cn(
        'grid grid-cols-[2rem_3rem_1fr_4rem_4rem] items-center gap-3 px-3 py-2 rounded-xl transition-colors',
        'hover:bg-white/5 cursor-pointer group'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onPlay?.(track)}
    >
      <span className="text-xs text-white/40 text-right">
        {hovered ? <Play size={14} className="fill-white text-white ml-auto" /> : index + 1}
      </span>
      {image && (
        <img src={image} alt={track.album.name} className="w-10 h-10 rounded object-cover" />
      )}
      <div className="overflow-hidden">
        <p className="text-sm font-bold truncate">{track.name}</p>
        <p className="text-xs text-white/50 truncate">
          {track.artists.map(a => a.name).join(', ')}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <div
          className="h-1 bg-white/20 rounded-full overflow-hidden w-16"
          title={`Popularity: ${track.popularity}`}
        >
          <div
            className="h-full bg-white/60 rounded-full"
            style={{ width: `${track.popularity}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-white/40 text-right">{formatDuration(track.duration_ms)}</span>
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

```bash
npx tsc -p tsconfig.app.json --noEmit
# Expected: no errors
```

- [ ] **Step 5: Commit**

```bash
git add src/mocks/handlers.ts src/components/shared/ArtistCard.tsx src/components/shared/TrackRow.tsx
git commit -m "feat: atualizar handlers MSW e adicionar ArtistCard e TrackRow"
```

---

### Task 6: Artists Page (TDD)

**Files:**
- Create: `src/pages/__tests__/Artists.test.tsx`
- Create: `src/pages/Artists.tsx`
- Modify: `src/router.tsx`
- Modify: `src/locales/pt-BR.json`
- Modify: `src/locales/en-US.json`

- [ ] **Step 1: Add i18n keys for Artists page**

Add to `src/locales/pt-BR.json`:

```json
{
  "nav": { "home": "Início", "artists": "Artistas", "profile": "Perfil", "favorites": "Favoritos" },
  "home": {
    "recentlyPlayed": "Tocadas Recentemente",
    "newReleases": "Novos Lançamentos",
    "recommendations": "Recomendados para Você",
    "seeMore": "Ver mais"
  },
  "login": {
    "title": "Spoter",
    "subtitle": "Sua experiência musical imersiva",
    "button": "Entrar com Spotify"
  },
  "player": { "nowPlaying": "Tocando agora" },
  "common": { "loading": "Carregando...", "error": "Algo deu errado", "retry": "Tentar novamente" },
  "artists": {
    "searchPlaceholder": "Buscar artistas...",
    "searchAlbums": "Buscar álbuns",
    "searchArtists": "Buscar artistas",
    "filterByGenre": "Filtrar por gênero",
    "noResults": "Nenhum resultado encontrado",
    "searchPrompt": "Digite para buscar artistas"
  },
  "favorites": {
    "title": "Título",
    "artist": "Artista",
    "album": "Álbum",
    "note": "Nota pessoal",
    "addButton": "Adicionar favorito",
    "searchPlaceholder": "Buscar nos favoritos...",
    "emptyList": "Nenhum favorito ainda",
    "removeConfirm": "Remover",
    "cancel": "Cancelar",
    "titleRequired": "Título é obrigatório",
    "artistRequired": "Artista é obrigatório"
  },
  "profile": {
    "followers": "seguidores",
    "topArtists": "Artistas Mais Ouvidos",
    "topTracks": "Faixas Favoritas",
    "audioProfile": "Perfil Musical",
    "fourWeeks": "4 semanas",
    "sixMonths": "6 meses",
    "allTime": "Longo prazo",
    "mostPlayedAlbums": "Álbuns Mais Ouvidos",
    "tracks": "faixas"
  }
}
```

Add to `src/locales/en-US.json`:

```json
{
  "nav": { "home": "Home", "artists": "Artists", "profile": "Profile", "favorites": "Favorites" },
  "home": {
    "recentlyPlayed": "Recently Played",
    "newReleases": "New Releases",
    "recommendations": "Recommended for You",
    "seeMore": "See more"
  },
  "login": {
    "title": "Spoter",
    "subtitle": "Your immersive music experience",
    "button": "Sign in with Spotify"
  },
  "player": { "nowPlaying": "Now playing" },
  "common": { "loading": "Loading...", "error": "Something went wrong", "retry": "Try again" },
  "artists": {
    "searchPlaceholder": "Search artists...",
    "searchAlbums": "Search albums",
    "searchArtists": "Search artists",
    "filterByGenre": "Filter by genre",
    "noResults": "No results found",
    "searchPrompt": "Type to search artists"
  },
  "favorites": {
    "title": "Title",
    "artist": "Artist",
    "album": "Album",
    "note": "Personal note",
    "addButton": "Add favorite",
    "searchPlaceholder": "Search favorites...",
    "emptyList": "No favorites yet",
    "removeConfirm": "Remove",
    "cancel": "Cancel",
    "titleRequired": "Title is required",
    "artistRequired": "Artist is required"
  },
  "profile": {
    "followers": "followers",
    "topArtists": "Top Artists",
    "topTracks": "Top Tracks",
    "audioProfile": "Audio Profile",
    "fourWeeks": "4 weeks",
    "sixMonths": "6 months",
    "allTime": "All time",
    "mostPlayedAlbums": "Most Played Albums",
    "tracks": "tracks"
  }
}
```

- [ ] **Step 2: Write Artists page test**

```tsx
// src/pages/__tests__/Artists.test.tsx
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n'
import { server } from '@/mocks/server'
import { Artists } from '../Artists'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderArtists() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <Artists />
        </QueryClientProvider>
      </MemoryRouter>
    </I18nextProvider>
  )
}

describe('Artists page', () => {
  it('renders search input', () => {
    renderArtists()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows artist results after typing a query', async () => {
    renderArtists()
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Mock' } })
    expect(await screen.findByText('Mock Artist')).toBeInTheDocument()
  })

  it('shows search prompt when query is empty', () => {
    renderArtists()
    expect(screen.getByText(/Digite para buscar/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run test to confirm it fails**

```bash
npx vitest run src/pages/__tests__/Artists.test.tsx
# Expected: FAIL - Cannot find module '../Artists'
```

- [ ] **Step 4: Implement Artists.tsx**

```tsx
// src/pages/Artists.tsx
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { useArtists } from '@/hooks/queries/useArtists'
import { useSearchAlbums } from '@/hooks/queries/useSearchAlbums'
import { useDebounce } from '@/hooks/useDebounce'
import { ArtistCard } from '@/components/shared/ArtistCard'
import { AlbumCard } from '@/components/shared/AlbumCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function Artists() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [mode, setMode] = useState<'artist' | 'album'>('artist')
  const [activeGenre, setActiveGenre] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, 400)

  const artists = useArtists(debouncedQuery, page)
  const albums = useSearchAlbums(debouncedQuery, page)

  const genres = useMemo(() => {
    if (!artists.data) return []
    const all = artists.data.flatMap(a => a.genres)
    return [...new Set(all)].slice(0, 12)
  }, [artists.data])

  const filteredArtists = useMemo(() => {
    if (!artists.data) return []
    if (!activeGenre) return artists.data
    return artists.data.filter(a => a.genres.includes(activeGenre))
  }, [artists.data, activeGenre])

  const isLoading = mode === 'artist' ? artists.isPending : albums.isPending
  const isEmpty = debouncedQuery.trim() === ''

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setPage(1)
    setActiveGenre(null)
  }

  function switchMode(next: 'artist' | 'album') {
    setMode(next)
    setPage(1)
    setActiveGenre(null)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Search bar + mode toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-lg">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder={t(`artists.${mode === 'artist' ? 'searchPlaceholder' : 'searchPlaceholder'}`)}
            className="glass-input w-full pl-9 pr-4 py-2.5 text-sm rounded-xl text-white placeholder:text-white/30"
          />
        </div>
        <div className="flex glass-card-md rounded-xl overflow-hidden">
          <button
            onClick={() => switchMode('artist')}
            className={cn('px-3 py-2 text-xs transition-colors', mode === 'artist' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white')}
          >
            {t('artists.searchArtists')}
          </button>
          <button
            onClick={() => switchMode('album')}
            className={cn('px-3 py-2 text-xs transition-colors', mode === 'album' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white')}
          >
            {t('artists.searchAlbums')}
          </button>
        </div>
      </div>

      {/* Genre filter chips (only in artist mode) */}
      {mode === 'artist' && genres.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            onClick={() => setActiveGenre(null)}
            className={cn('cursor-pointer text-xs', !activeGenre && 'bg-white/15')}
          >
            Todos
          </Badge>
          {genres.map(g => (
            <Badge
              key={g}
              variant="outline"
              onClick={() => setActiveGenre(g === activeGenre ? null : g)}
              className={cn('cursor-pointer text-xs capitalize', activeGenre === g && 'bg-white/15')}
            >
              {g}
            </Badge>
          ))}
        </div>
      )}

      {/* Results */}
      {isEmpty ? (
        <p className="text-white/40 text-sm text-center py-16">{t('artists.searchPrompt')}</p>
      ) : isLoading ? (
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="w-44 h-64 rounded-2xl" />
          ))}
        </div>
      ) : mode === 'artist' ? (
        <>
          {filteredArtists.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-16">{t('artists.noResults')}</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {filteredArtists.map(artist => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-wrap gap-4">
          {(albums.data ?? []).map(album => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isEmpty && !isLoading && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-1.5 glass-button rounded-lg text-sm disabled:opacity-30"
          >
            ← Anterior
          </button>
          <span className="text-sm text-white/50">{page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-1.5 glass-button rounded-lg text-sm"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Add route to router.tsx**

Replace `src/router.tsx`:

```typescript
// src/router.tsx
import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { Login } from '@/pages/Login'
import { OAuthCallback } from '@/pages/OAuthCallback'
import { Home } from '@/pages/Home'
import { Artists } from '@/pages/Artists'
import { ArtistDetail } from '@/pages/ArtistDetail'
import { Profile } from '@/pages/Profile'
import { Favorites } from '@/pages/Favorites'

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/callback', element: <OAuthCallback /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: 'artists', element: <Artists /> },
      { path: 'artists/:id', element: <ArtistDetail /> },
      { path: 'profile', element: <Profile /> },
      { path: 'favorites', element: <Favorites /> },
    ],
  },
])
```

Note: `ArtistDetail`, `Profile`, and `Favorites` don't exist yet. The TypeScript compiler will error. Create stub files to unblock the build:

```typescript
// src/pages/ArtistDetail.tsx
export function ArtistDetail() { return <div>Artist Detail — TODO</div> }

// src/pages/Profile.tsx
export function Profile() { return <div>Profile — TODO</div> }

// src/pages/Favorites.tsx
export function Favorites() { return <div>Favorites — TODO</div> }
```

- [ ] **Step 6: Run Artists tests**

```bash
npx vitest run src/pages/__tests__/Artists.test.tsx
# Expected: PASS - 3 tests
```

- [ ] **Step 7: Run full test suite**

```bash
npm run test
# Expected: all previous tests + 3 Artists tests = PASS
```

- [ ] **Step 8: Commit**

```bash
git add src/pages/Artists.tsx src/pages/__tests__/Artists.test.tsx src/pages/ArtistDetail.tsx src/pages/Profile.tsx src/pages/Favorites.tsx src/router.tsx src/locales/
git commit -m "feat: implementar página Artists com busca, filtro por gênero e paginação"
```

---

### Task 7: Artist Detail Page

**Files:**
- Replace: `src/pages/ArtistDetail.tsx`

- [ ] **Step 1: Implement ArtistDetail.tsx**

```tsx
// src/pages/ArtistDetail.tsx
import { useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useArtist } from '@/hooks/queries/useArtist'
import { useArtistTopTracks } from '@/hooks/queries/useArtistTopTracks'
import { useArtistAlbums } from '@/hooks/queries/useArtistAlbums'
import { usePlayer } from '@/hooks/usePlayer'
import { extractPalette } from '@/lib/colorThief'
import { formatNumber } from '@/utils/formatNumber'
import { TrackRow } from '@/components/shared/TrackRow'
import { AlbumCard } from '@/components/shared/AlbumCard'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { SpotifyTrack } from '@/types/spotify'

type Tab = 'tracks' | 'albums'

export function ArtistDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { dispatch } = usePlayer()

  const [tab, setTab] = useState<Tab>('tracks')
  const [tracksPage, setTracksPage] = useState(0)
  const [albumsPage, setAlbumsPage] = useState(1)

  const artist = useArtist(id!)
  const topTracks = useArtistTopTracks(id!)
  const albums = useArtistAlbums(id!, albumsPage)

  const TRACKS_PER_PAGE = 10
  const pagedTracks = topTracks.data?.slice(tracksPage * TRACKS_PER_PAGE, (tracksPage + 1) * TRACKS_PER_PAGE) ?? []
  const totalTrackPages = Math.ceil((topTracks.data?.length ?? 0) / TRACKS_PER_PAGE)

  const handlePlay = useCallback(
    async (track: SpotifyTrack) => {
      dispatch({ type: 'SET_TRACK', payload: track })
      dispatch({ type: 'TOGGLE_PLAY' })
      if (topTracks.data) dispatch({ type: 'SET_QUEUE', payload: topTracks.data })
      const imageUrl = track.album.images[0]?.url
      if (imageUrl) {
        const palette = await extractPalette(imageUrl)
        if (palette) dispatch({ type: 'SET_PALETTE', payload: palette })
      }
    },
    [dispatch, topTracks.data]
  )

  if (artist.isPending) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-8 w-48" />
      </div>
    )
  }

  if (!artist.data) return null

  const heroImage = artist.data.images[0]?.url

  return (
    <div className="min-h-full">
      {/* Hero */}
      <div className="relative h-72 overflow-hidden rounded-b-2xl">
        {heroImage && (
          <img src={heroImage} alt={artist.data.name} className="w-full h-full object-cover object-top" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <button
          onClick={() => navigate('/artists')}
          className="absolute top-4 left-4 glass-button p-2 rounded-xl"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-4xl font-bold drop-shadow">{artist.data.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-white/70">
              {formatNumber(artist.data.followers.total)} followers
            </span>
            <span className="text-sm text-white/50">
              {artist.data.genres.slice(0, 3).join(' · ')}
            </span>
          </div>
          {/* Popularity bar */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-white/40">Popularidade</span>
            <div className="h-1 w-32 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/70 rounded-full"
                style={{ width: `${artist.data.popularity}%` }}
              />
            </div>
            <span className="text-xs text-white/40">{artist.data.popularity}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-6 space-y-4">
        <div className="flex glass-card-md rounded-xl overflow-hidden w-fit">
          {(['tracks', 'albums'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-5 py-2 text-sm transition-colors',
                tab === t ? 'bg-white/15 text-white font-bold' : 'text-white/50 hover:text-white'
              )}
            >
              {t === 'tracks' ? 'Top Tracks' : 'Álbuns'}
            </button>
          ))}
        </div>

        {/* Top Tracks */}
        {tab === 'tracks' && (
          <div className="space-y-1">
            {topTracks.isPending
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
              : pagedTracks.map((track, i) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    index={tracksPage * TRACKS_PER_PAGE + i}
                    onPlay={handlePlay}
                  />
                ))}
            {totalTrackPages > 1 && (
              <div className="flex justify-center gap-3 pt-2">
                <button
                  disabled={tracksPage === 0}
                  onClick={() => setTracksPage(p => p - 1)}
                  className="px-3 py-1 glass-button rounded-lg text-xs disabled:opacity-30"
                >← Anterior</button>
                <span className="text-xs text-white/50 self-center">{tracksPage + 1}/{totalTrackPages}</span>
                <button
                  disabled={tracksPage >= totalTrackPages - 1}
                  onClick={() => setTracksPage(p => p + 1)}
                  className="px-3 py-1 glass-button rounded-lg text-xs disabled:opacity-30"
                >Próxima →</button>
              </div>
            )}
          </div>
        )}

        {/* Albums */}
        {tab === 'albums' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {albums.isPending
                ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="w-40 h-56 rounded-2xl" />)
                : albums.data?.items.map(album => <AlbumCard key={album.id} album={album} />)}
            </div>
            {albums.data && albums.data.total > 10 && (
              <div className="flex justify-center gap-3">
                <button
                  disabled={albumsPage === 1}
                  onClick={() => setAlbumsPage(p => p - 1)}
                  className="px-3 py-1 glass-button rounded-lg text-xs disabled:opacity-30"
                >← Anterior</button>
                <span className="text-xs text-white/50 self-center">{albumsPage}</span>
                <button
                  disabled={!albums.data.next}
                  onClick={() => setAlbumsPage(p => p + 1)}
                  className="px-3 py-1 glass-button rounded-lg text-xs disabled:opacity-30"
                >Próxima →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc -p tsconfig.app.json --noEmit
# Expected: no errors
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/ArtistDetail.tsx
git commit -m "feat: implementar página Artist Detail com hero, top tracks e álbuns"
```

---

### Task 8: Favorites Page (TDD)

**Files:**
- Create: `src/pages/__tests__/Favorites.test.tsx`
- Replace: `src/pages/Favorites.tsx`

- [ ] **Step 1: Write Favorites page test**

```tsx
// src/pages/__tests__/Favorites.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n'
import { Favorites } from '../Favorites'

beforeEach(() => {
  localStorage.clear()
})

function renderFavorites() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <Favorites />
      </MemoryRouter>
    </I18nextProvider>
  )
}

describe('Favorites page', () => {
  it('renders the form with title and artist fields', () => {
    renderFavorites()
    expect(screen.getByLabelText(/Título/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Artista/i)).toBeInTheDocument()
  })

  it('shows validation error when submitting empty title', async () => {
    renderFavorites()
    fireEvent.click(screen.getByRole('button', { name: /Adicionar/i }))
    expect(await screen.findByText(/Título é obrigatório/i)).toBeInTheDocument()
  })

  it('adds a favorite and shows it in the list', async () => {
    renderFavorites()
    fireEvent.change(screen.getByLabelText(/Título/i), { target: { value: 'My Track' } })
    fireEvent.change(screen.getByLabelText(/Artista/i), { target: { value: 'My Artist' } })
    fireEvent.click(screen.getByRole('button', { name: /Adicionar/i }))
    expect(await screen.findByText('My Track')).toBeInTheDocument()
  })

  it('filters favorites by search query', async () => {
    renderFavorites()
    fireEvent.change(screen.getByLabelText(/Título/i), { target: { value: 'Unique Track' } })
    fireEvent.change(screen.getByLabelText(/Artista/i), { target: { value: 'Some Artist' } })
    fireEvent.click(screen.getByRole('button', { name: /Adicionar/i }))
    await screen.findByText('Unique Track')
    const searchInput = screen.getByPlaceholderText(/Buscar/i)
    fireEvent.change(searchInput, { target: { value: 'xyz_no_match' } })
    await waitFor(() => expect(screen.queryByText('Unique Track')).not.toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/pages/__tests__/Favorites.test.tsx
# Expected: FAIL - form elements not found (stub component)
```

- [ ] **Step 3: Implement Favorites.tsx**

```tsx
// src/pages/Favorites.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Trash2, X } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'
import { FavoriteTrackFormSchema, type FavoriteTrackForm } from '@/types/favorites'
import { GlassCard } from '@/components/shared/GlassCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Favorites() {
  const { t } = useTranslation()
  const { favorites, add, remove, search } = useFavorites()
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FavoriteTrackForm>({ resolver: zodResolver(FavoriteTrackFormSchema) })

  function onSubmit(data: FavoriteTrackForm) {
    add(data)
    reset()
  }

  const displayed = searchQuery.trim() ? search(searchQuery) : favorites

  return (
    <div className="p-6 space-y-8 max-w-2xl mx-auto">
      {/* Form */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-white/70">
          Adicionar Favorito
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label htmlFor="title" className="text-xs text-white/50 mb-1 block">
              {t('favorites.title')} *
            </label>
            <input
              id="title"
              {...register('title')}
              placeholder={t('favorites.title')}
              className={cn(
                'glass-input w-full px-3 py-2 text-sm rounded-xl text-white',
                errors.title && 'ring-red-400/60'
              )}
            />
            {errors.title && (
              <p className="text-red-400 text-xs mt-1">{t('favorites.titleRequired')}</p>
            )}
          </div>

          <div>
            <label htmlFor="artist" className="text-xs text-white/50 mb-1 block">
              {t('favorites.artist')} *
            </label>
            <input
              id="artist"
              {...register('artist')}
              placeholder={t('favorites.artist')}
              className={cn(
                'glass-input w-full px-3 py-2 text-sm rounded-xl text-white',
                errors.artist && 'ring-red-400/60'
              )}
            />
            {errors.artist && (
              <p className="text-red-400 text-xs mt-1">{t('favorites.artistRequired')}</p>
            )}
          </div>

          <div>
            <label htmlFor="album" className="text-xs text-white/50 mb-1 block">
              {t('favorites.album')}
            </label>
            <input
              id="album"
              {...register('album')}
              placeholder={t('favorites.album')}
              className="glass-input w-full px-3 py-2 text-sm rounded-xl text-white"
            />
          </div>

          <div>
            <label htmlFor="note" className="text-xs text-white/50 mb-1 block">
              {t('favorites.note')}
            </label>
            <textarea
              id="note"
              {...register('note')}
              rows={2}
              placeholder={t('favorites.note')}
              className="glass-input w-full px-3 py-2 text-sm rounded-xl text-white resize-none"
            />
          </div>

          <Button type="submit" className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20">
            {t('favorites.addButton')}
          </Button>
        </form>
      </div>

      {/* Search + list */}
      <div className="space-y-4">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t('favorites.searchPlaceholder')}
          className="glass-input w-full px-3 py-2.5 text-sm rounded-xl text-white placeholder:text-white/30"
        />

        {displayed.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-12">{t('favorites.emptyList')}</p>
        ) : (
          <div className="space-y-3">
            {displayed.map(fav => (
              <GlassCard key={fav.id} className="flex items-start justify-between gap-3 p-4">
                <div className="overflow-hidden flex-1">
                  <p className="font-bold text-sm truncate">{fav.title}</p>
                  <p className="text-xs text-white/60 truncate">{fav.artist}</p>
                  {fav.album && <p className="text-xs text-white/40 truncate">{fav.album}</p>}
                  {fav.note && <p className="text-xs text-white/30 mt-1 italic truncate">{fav.note}</p>}
                </div>
                <div className="shrink-0">
                  {confirmId === fav.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { remove(fav.id); setConfirmId(null) }}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded glass-button"
                      >
                        {t('favorites.removeConfirm')}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-white/40 hover:text-white text-xs px-2 py-1 rounded glass-button"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(fav.id)}
                      className="text-white/30 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run Favorites tests**

```bash
npx vitest run src/pages/__tests__/Favorites.test.tsx
# Expected: PASS - 4 tests
```

- [ ] **Step 5: Run full test suite**

```bash
npm run test
# Expected: PASS - all tests
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/Favorites.tsx src/pages/__tests__/Favorites.test.tsx
git commit -m "feat: implementar página Favorites com formulário validado, lista e busca local"
```

---

### Task 9: Profile Page

**Files:**
- Replace: `src/pages/Profile.tsx`

Recharts is already installed. This page uses `useUserTopTracks`, `useUserTopArtistsFull`, and `useAudioFeatures`. No new hooks needed.

- [ ] **Step 1: Implement Profile.tsx**

```tsx
// src/pages/Profile.tsx
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useUserTopTracks, useUserTopArtistsFull } from '@/hooks/queries/useUserTopItems'
import { useAudioFeatures } from '@/hooks/queries/useAudioFeatures'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type TimeRange = 'short_term' | 'medium_term' | 'long_term'

const TIME_RANGES: { value: TimeRange; labelKey: string }[] = [
  { value: 'short_term', labelKey: 'profile.fourWeeks' },
  { value: 'medium_term', labelKey: 'profile.sixMonths' },
  { value: 'long_term', labelKey: 'profile.allTime' },
]

export function Profile() {
  const { t } = useTranslation()
  const { state: auth } = useAuth()
  const [timeRange, setTimeRange] = useState<TimeRange>('short_term')

  const topTracks = useUserTopTracks('short_term', 5)
  const topArtists = useUserTopArtistsFull(timeRange, 10)

  const trackIds = topTracks.data?.map(t => t.id) ?? []
  const audioFeatures = useAudioFeatures(trackIds)

  // Radar chart: average of 5 audio features across top tracks
  const radarData = useMemo(() => {
    if (!audioFeatures.data || audioFeatures.data.length === 0) return []
    const keys: (keyof typeof audioFeatures.data[0])[] = [
      'danceability', 'energy', 'valence', 'acousticness', 'speechiness',
    ]
    return keys.map(key => ({
      feature: key.charAt(0).toUpperCase() + key.slice(1),
      value: Number(
        (audioFeatures.data!.reduce((sum, f) => sum + (f[key] as number), 0) / audioFeatures.data!.length).toFixed(2)
      ),
    }))
  }, [audioFeatures.data])

  // Bar chart: top artists
  const barData = useMemo(
    () => (topArtists.data ?? []).map(a => ({ name: a.name.slice(0, 14), popularity: a.popularity })),
    [topArtists.data]
  )

  // Most listened albums (inferred from top tracks)
  const albumCounts = useMemo(() => {
    const map = new Map<string, { name: string; image: string; count: number }>()
    topTracks.data?.forEach(track => {
      const al = track.album
      const entry = map.get(al.id) ?? { name: al.name, image: al.images[0]?.url ?? '', count: 0 }
      entry.count++
      map.set(al.id, entry)
    })
    return [...map.values()].sort((a, b) => b.count - a.count)
  }, [topTracks.data])

  const profile = auth.profile

  return (
    <div className="p-6 space-y-8 max-w-3xl mx-auto">
      {/* Avatar + info */}
      <div className="glass-card p-6 flex items-center gap-5">
        {profile?.images[0]?.url ? (
          <img src={profile.images[0].url} alt="avatar" className="w-20 h-20 rounded-full object-cover ring-2 ring-white/20" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-3xl">
            {profile?.display_name?.[0]}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{profile?.display_name}</h1>
          <p className="text-sm text-white/50">{profile?.email}</p>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-white/40">
              {profile?.followers.total} {t('profile.followers')}
            </span>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              profile?.product === 'premium' ? 'bg-[#1DB954]/20 text-[#1DB954]' : 'bg-white/10 text-white/50'
            )}>
              {profile?.product}
            </span>
          </div>
        </div>
      </div>

      {/* Radar chart — audio profile */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-white/70">{t('profile.audioProfile')}</h2>
        {audioFeatures.isPending || topTracks.isPending ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : radarData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="feature" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
              <Radar dataKey="value" stroke="rgba(147,51,234,0.8)" fill="rgba(147,51,234,0.25)" />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-white/30 text-sm text-center py-8">Ouça mais músicas para ver seu perfil</p>
        )}
      </div>

      {/* Bar chart — top artists */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white/70">{t('profile.topArtists')}</h2>
          <div className="flex glass-card-md rounded-xl overflow-hidden">
            {TIME_RANGES.map(({ value, labelKey }) => (
              <button
                key={value}
                onClick={() => setTimeRange(value)}
                className={cn(
                  'px-3 py-1.5 text-xs transition-colors',
                  timeRange === value ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'
                )}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>
        {topArtists.isPending ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
                itemStyle={{ color: 'rgba(255,255,255,0.6)' }}
              />
              <Bar dataKey="popularity" radius={[4, 4, 0, 0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={`rgba(147,51,234,${0.4 + (barData.length - i) / barData.length * 0.5})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Most listened albums */}
      {albumCounts.length > 0 && (
        <div className="glass-card p-6 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white/70">{t('profile.mostPlayedAlbums')}</h2>
          <div className="space-y-2">
            {albumCounts.map(al => (
              <div key={al.name} className="flex items-center gap-3">
                {al.image && <img src={al.image} alt={al.name} className="w-10 h-10 rounded object-cover" />}
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm truncate">{al.name}</p>
                </div>
                <span className="text-xs text-white/40 shrink-0">
                  {al.count} {t('profile.tracks')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc -p tsconfig.app.json --noEmit
# Expected: no errors
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Profile.tsx
git commit -m "feat: implementar página Profile com radar chart, bar chart e álbuns mais ouvidos"
```

---

### Task 10: MiniPlayer Full Controls

**Files:**
- Replace: `src/components/layout/MiniPlayer.tsx`

The MiniPlayer controls the `PlayerContext` state via `dispatch`. For Spotify Web Playback SDK (streaming), real audio playback requires the SDK — but since that's complex OAuth-gated SDK work, the MiniPlayer will dispatch actions to the local `PlayerContext` state (which powers the UI) and make the Spotify API calls for remote device control via the `user-modify-playback-state` scope.

- [ ] **Step 1: Replace MiniPlayer.tsx with full controls**

```tsx
// src/components/layout/MiniPlayer.tsx
import { useCallback } from 'react'
import { SkipBack, Play, Pause, SkipForward, Volume2, Maximize2, Shuffle, Repeat, Repeat1 } from 'lucide-react'
import { usePlayer } from '@/hooks/usePlayer'
import { useTranslation } from 'react-i18next'
import { formatDuration } from '@/utils/formatDuration'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'

export function MiniPlayer() {
  const { state, dispatch } = usePlayer()
  const { t } = useTranslation()
  const { currentTrack, isPlaying, progress, duration, volume, shuffle, repeat } = state

  const handlePlayPause = useCallback(async () => {
    dispatch({ type: 'TOGGLE_PLAY' })
    try {
      await api.put(isPlaying ? '/me/player/pause' : '/me/player/play')
    } catch {
      // silently fail — user may not have an active device
    }
  }, [dispatch, isPlaying])

  const handlePrev = useCallback(async () => {
    try {
      await api.post('/me/player/previous')
    } catch { /* silent */ }
  }, [])

  const handleNext = useCallback(async () => {
    dispatch({ type: 'SET_PROGRESS', payload: 0 })
    try {
      await api.post('/me/player/next')
    } catch { /* silent */ }
  }, [dispatch])

  const handleSeek = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const ms = Number(e.target.value)
      dispatch({ type: 'SET_PROGRESS', payload: ms })
      try {
        await api.put('/me/player/seek', null, { params: { position_ms: ms } })
      } catch { /* silent */ }
    },
    [dispatch]
  )

  const handleVolume = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: 'SET_VOLUME', payload: Number(e.target.value) })
    },
    [dispatch]
  )

  const toggleShuffle = useCallback(async () => {
    dispatch({ type: 'TOGGLE_SHUFFLE' })
    try {
      await api.put('/me/player/shuffle', null, { params: { state: !shuffle } })
    } catch { /* silent */ }
  }, [dispatch, shuffle])

  const cycleRepeat = useCallback(async () => {
    const next = repeat === 'off' ? 'context' : repeat === 'context' ? 'track' : 'off'
    dispatch({ type: 'SET_REPEAT', payload: next })
    try {
      await api.put('/me/player/repeat', null, { params: { state: next } })
    } catch { /* silent */ }
  }, [dispatch, repeat])

  return (
    <div className="glass-card-md shrink-0 border-t border-white/5 px-4 py-3 flex items-center gap-4">
      {/* Track info */}
      <div className="flex items-center gap-3 w-56 shrink-0">
        {currentTrack ? (
          <>
            <img
              src={currentTrack.album.images[0]?.url}
              alt={currentTrack.album.name}
              className="w-11 h-11 rounded-lg object-cover shrink-0"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">{currentTrack.name}</p>
              <p className="text-xs text-white/50 truncate">
                {currentTrack.artists.map(a => a.name).join(', ')}
              </p>
            </div>
          </>
        ) : (
          <p className="text-xs text-white/30">{t('player.nowPlaying')}</p>
        )}
      </div>

      {/* Controls + progress */}
      <div className="flex flex-col items-center gap-1.5 flex-1">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            className={cn('transition-colors', shuffle ? 'text-primary' : 'text-white/40 hover:text-white')}
          >
            <Shuffle size={14} />
          </button>
          <button onClick={handlePrev} className="text-white/70 hover:text-white transition-colors">
            <SkipBack size={18} className="fill-current" />
          </button>
          <button
            onClick={handlePlayPause}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying
              ? <Pause size={14} className="fill-black text-black" />
              : <Play size={14} className="fill-black text-black ml-0.5" />}
          </button>
          <button onClick={handleNext} className="text-white/70 hover:text-white transition-colors">
            <SkipForward size={18} className="fill-current" />
          </button>
          <button
            onClick={cycleRepeat}
            className={cn('transition-colors', repeat !== 'off' ? 'text-primary' : 'text-white/40 hover:text-white')}
          >
            {repeat === 'track' ? <Repeat1 size={14} /> : <Repeat size={14} />}
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 w-full max-w-sm">
          <span className="text-xs text-white/30 w-8 text-right">{formatDuration(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={progress}
            onChange={handleSeek}
            className="flex-1 h-1 appearance-none bg-white/20 rounded-full accent-white cursor-pointer"
          />
          <span className="text-xs text-white/30 w-8">{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Volume + expand */}
      <div className="flex items-center gap-3 w-40 justify-end shrink-0">
        <Volume2 size={14} className="text-white/40 shrink-0" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={handleVolume}
          className="w-20 h-1 appearance-none bg-white/20 rounded-full accent-white cursor-pointer"
        />
        <button
          onClick={() => dispatch({ type: 'TOGGLE_FULLSCREEN' })}
          className="text-white/40 hover:text-white transition-colors"
        >
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc -p tsconfig.app.json --noEmit
# Expected: no errors
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/MiniPlayer.tsx
git commit -m "feat: adicionar controles completos ao MiniPlayer (play/pause, seek, volume, shuffle, repeat)"
```

---

### Task 11: Fullscreen Player

**Files:**
- Create: `src/components/layout/FullscreenPlayer.tsx`
- Modify: `src/components/layout/AppShell.tsx`

- [ ] **Step 1: Write FullscreenPlayer.tsx**

```tsx
// src/components/layout/FullscreenPlayer.tsx
import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, SkipBack, Play, Pause, SkipForward, Volume2, Shuffle, Repeat, Repeat1, Music } from 'lucide-react'
import { usePlayer } from '@/hooks/usePlayer'
import { useLyrics } from '@/hooks/queries/useLyrics'
import { formatDuration } from '@/utils/formatDuration'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'

export function FullscreenPlayer() {
  const { state, dispatch } = usePlayer()
  const { currentTrack, isPlaying, progress, duration, volume, shuffle, repeat, isFullscreen, palette } = state
  const [showLyrics, setShowLyrics] = useState(false)

  const artistName = currentTrack?.artists[0]?.name ?? ''
  const trackName = currentTrack?.name ?? ''
  const lyrics = useLyrics(artistName, trackName)

  const [primary, secondary] = palette ?? ['45,27,105', '22,33,62']

  const handlePlayPause = useCallback(async () => {
    dispatch({ type: 'TOGGLE_PLAY' })
    try {
      await api.put(isPlaying ? '/me/player/pause' : '/me/player/play')
    } catch { /* silent */ }
  }, [dispatch, isPlaying])

  const handlePrev = useCallback(async () => {
    try { await api.post('/me/player/previous') } catch { /* silent */ }
  }, [])

  const handleNext = useCallback(async () => {
    dispatch({ type: 'SET_PROGRESS', payload: 0 })
    try { await api.post('/me/player/next') } catch { /* silent */ }
  }, [dispatch])

  const handleSeek = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const ms = Number(e.target.value)
      dispatch({ type: 'SET_PROGRESS', payload: ms })
      try { await api.put('/me/player/seek', null, { params: { position_ms: ms } }) } catch { /* silent */ }
    },
    [dispatch]
  )

  const toggleShuffle = useCallback(async () => {
    dispatch({ type: 'TOGGLE_SHUFFLE' })
    try { await api.put('/me/player/shuffle', null, { params: { state: !shuffle } }) } catch { /* silent */ }
  }, [dispatch, shuffle])

  const cycleRepeat = useCallback(async () => {
    const next = repeat === 'off' ? 'context' : repeat === 'context' ? 'track' : 'off'
    dispatch({ type: 'SET_REPEAT', payload: next })
    try { await api.put('/me/player/repeat', null, { params: { state: next } }) } catch { /* silent */ }
  }, [dispatch, repeat])

  return (
    <AnimatePresence>
      {isFullscreen && (
        <motion.div
          className="fixed inset-0 z-50 flex overflow-hidden"
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          style={{
            background: `radial-gradient(ellipse at 20% 30%, rgba(${primary},0.5) 0%, transparent 55%),
                         radial-gradient(ellipse at 80% 70%, rgba(${secondary},0.4) 0%, transparent 55%),
                         rgb(8,8,12)`,
          }}
        >
          {/* Blurred album art background */}
          {currentTrack?.album.images[0]?.url && (
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url(${currentTrack.album.images[0].url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(60px)',
              }}
            />
          )}

          <div className="relative flex flex-col w-full p-8 gap-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => dispatch({ type: 'TOGGLE_FULLSCREEN' })}
                className="glass-button p-2 rounded-xl"
              >
                <X size={18} />
              </button>
              <p className="text-xs text-white/40 uppercase tracking-widest">Tocando agora</p>
              <button
                onClick={() => setShowLyrics(l => !l)}
                className={cn('glass-button p-2 rounded-xl transition-colors', showLyrics && 'bg-white/20')}
              >
                <Music size={18} />
              </button>
            </div>

            {/* Main content */}
            <div className="flex flex-1 gap-8 items-center overflow-hidden">
              {/* Album art + info */}
              <div className="flex flex-col items-center gap-6 flex-1">
                {currentTrack?.album.images[0]?.url && (
                  <motion.img
                    key={currentTrack.id}
                    src={currentTrack.album.images[0].url}
                    alt={currentTrack.album.name}
                    className="w-64 h-64 rounded-2xl object-cover"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ boxShadow: `0 0 60px rgba(${primary},0.4)` }}
                  />
                )}
                <div className="text-center">
                  <h2 className="text-2xl font-bold">{currentTrack?.name}</h2>
                  <p className="text-white/60 mt-1">
                    {currentTrack?.artists.map(a => a.name).join(', ')}
                  </p>
                  <p className="text-white/30 text-sm mt-0.5">{currentTrack?.album.name}</p>
                </div>
              </div>

              {/* Lyrics panel */}
              {showLyrics && (
                <div className="flex-1 h-full overflow-y-auto glass-card p-6">
                  {lyrics.isPending ? (
                    <p className="text-white/30 text-sm">Buscando letra...</p>
                  ) : lyrics.data ? (
                    <pre className="font-sans text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                      {lyrics.data}
                    </pre>
                  ) : (
                    <div className="text-center space-y-2 py-8">
                      <p className="text-white/30 text-sm">Letra não encontrada</p>
                      {currentTrack && (
                        <div className="glass-card-md p-4 text-left space-y-1 mt-4">
                          <p className="text-xs text-white/50">Álbum: {currentTrack.album.name}</p>
                          <p className="text-xs text-white/50">
                            Lançamento: {currentTrack.album.release_date}
                          </p>
                          <p className="text-xs text-white/50">Popularidade: {currentTrack.popularity}</p>
                          <p className="text-xs text-white/50">
                            Duração: {formatDuration(currentTrack.duration_ms)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-4">
              {/* Progress */}
              <div className="flex items-center gap-3 w-full max-w-lg">
                <span className="text-xs text-white/40 w-10 text-right">{formatDuration(progress)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  value={progress}
                  onChange={handleSeek}
                  className="flex-1 h-1.5 appearance-none bg-white/20 rounded-full accent-white cursor-pointer"
                />
                <span className="text-xs text-white/40 w-10">{formatDuration(duration)}</span>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-6">
                <button
                  onClick={toggleShuffle}
                  className={cn(shuffle ? 'text-primary' : 'text-white/40 hover:text-white', 'transition-colors')}
                >
                  <Shuffle size={18} />
                </button>
                <button onClick={handlePrev} className="text-white/70 hover:text-white transition-colors">
                  <SkipBack size={24} className="fill-current" />
                </button>
                <button
                  onClick={handlePlayPause}
                  className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
                >
                  {isPlaying
                    ? <Pause size={22} className="fill-black text-black" />
                    : <Play size={22} className="fill-black text-black ml-1" />}
                </button>
                <button onClick={handleNext} className="text-white/70 hover:text-white transition-colors">
                  <SkipForward size={24} className="fill-current" />
                </button>
                <button
                  onClick={cycleRepeat}
                  className={cn(repeat !== 'off' ? 'text-primary' : 'text-white/40 hover:text-white', 'transition-colors')}
                >
                  {repeat === 'track' ? <Repeat1 size={18} /> : <Repeat size={18} />}
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <Volume2 size={14} className="text-white/40" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={e => dispatch({ type: 'SET_VOLUME', payload: Number(e.target.value) })}
                  className="w-28 h-1 appearance-none bg-white/20 rounded-full accent-white cursor-pointer"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Update AppShell.tsx to render FullscreenPlayer**

Replace `src/components/layout/AppShell.tsx`:

```tsx
// src/components/layout/AppShell.tsx
import { Outlet } from 'react-router-dom'
import { DynamicBackground } from './DynamicBackground'
import { Sidebar } from './Sidebar'
import { MiniPlayer } from './MiniPlayer'
import { FullscreenPlayer } from './FullscreenPlayer'

export function AppShell() {
  return (
    <>
      <DynamicBackground />
      <FullscreenPlayer />
      <div className="flex h-screen overflow-hidden gap-2 p-2">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden gap-2">
          <main className="flex-1 overflow-y-auto rounded-2xl">
            <Outlet />
          </main>
          <MiniPlayer />
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Verify TypeScript and all tests**

```bash
npx tsc -p tsconfig.app.json --noEmit
npm run test
# Expected: no TS errors, all tests PASS
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/FullscreenPlayer.tsx src/components/layout/AppShell.tsx
git commit -m "feat: implementar FullscreenPlayer com lyrics, controles completos e animação de entrada"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered |
|---|---|
| `/artists` — grid, busca, paginação, filtro gênero | ✅ Task 6 |
| `/artists` — toggle busca por álbum | ✅ Task 6 |
| `/artists/:id` — hero, genres, followers, popularity | ✅ Task 7 |
| `/artists/:id` — tabs Top Tracks / Álbuns | ✅ Task 7 |
| `/artists/:id` — tabela com hover play | ✅ Task 7 + Task 5 (TrackRow) |
| `/artists/:id` — paginação tracks e álbuns | ✅ Task 7 |
| `/favorites` — form RHF + Zod, validação inline | ✅ Task 8 |
| `/favorites` — salva localStorage via useFavorites | ✅ Tasks 4 + 8 |
| `/favorites` — busca local em tempo real | ✅ Task 8 |
| `/favorites` — botão remover com confirmação inline | ✅ Task 8 |
| `/profile` — avatar, nome, email, plano, followers | ✅ Task 9 |
| `/profile` — radar chart audio features (Recharts) | ✅ Task 9 |
| `/profile` — bar chart top artists com toggle período | ✅ Task 9 |
| `/profile` — álbuns mais ouvidos | ✅ Task 9 |
| MiniPlayer — play/pause, prev/next | ✅ Task 10 |
| MiniPlayer — progress bar seek | ✅ Task 10 |
| MiniPlayer — volume slider | ✅ Task 10 |
| MiniPlayer — shuffle + repeat | ✅ Task 10 |
| FullscreenPlayer — overlay expansível | ✅ Task 11 |
| FullscreenPlayer — album art com glow | ✅ Task 11 |
| FullscreenPlayer — toggle lyrics (lyrics.ovh) | ✅ Tasks 3 + 11 |
| FullscreenPlayer — fallback metadata se sem lyrics | ✅ Task 11 |
| FullscreenPlayer — botão minimizar | ✅ Task 11 |
| DynamicBackground rgba bug | ✅ Task 1 |
| tsconfig build bug | ✅ Task 1 |
| i18n pt-BR + en-US para novas páginas | ✅ Task 6 |
| MSW handlers para todos os novos endpoints | ✅ Task 5 |
| Reducer tests (existentes) | ✅ inherited from plan 1 |
| useFavorites TDD | ✅ Task 4 |
| Artists page TDD | ✅ Task 6 |
| Favorites page TDD | ✅ Task 8 |

**Placeholder scan:** None. All steps include actual code.

**Type consistency:**
- `SpotifyArtist` defined in Task 2, used in Tasks 3, 5, 6, 7, 9 — consistent
- `AudioFeatures` defined in Task 2, used in Task 3 (`useAudioFeatures`) and Task 9 — consistent
- `PlayerState` (Spotify API) defined in Task 2, used in Task 3 (`useNowPlaying`) — consistent
- `palette: [string, string]` format changed from `"rgb(r,g,b)"` to `"r,g,b"` in Task 1; all consumers updated in same task — consistent
- `FavoriteTrackForm` from `src/types/favorites.ts` used in Task 4 (useFavorites) and Task 8 (Favorites page) — consistent
