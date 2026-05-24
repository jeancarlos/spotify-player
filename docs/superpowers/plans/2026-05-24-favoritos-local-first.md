# Favoritos Local-first — Plano de Implementação

> **Para agentes:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar favoritos para depender de localStorage como fonte de verdade, adicionar nota pessoal por faixa, arc label no disco de vinil ao tocar favorito, e formulário de adição com autocomplete + validação rhf+Zod.

**Architecture:** Camada de utilitários puros (`favStorage`, `favCookie`, `favHydration`) isolados de React. Hook `useSpoterPlaylist` orquestra os utilitários via refs para escritas síncronas. Componentes não tocam diretamente `localStorage` ou `document.cookie`.

**Tech Stack:** React 19, TypeScript, react-hook-form 7, Zod 3, Framer Motion 11, Vitest + Testing Library, i18next

---

## Mapa de arquivos

| Arquivo | Op | Responsabilidade |
|---|---|---|
| `src/locales/pt-BR.json` | Mod | Novas chaves i18n |
| `src/locales/en-US.json` | Mod | Novas chaves i18n |
| `src/utils/favStorage.ts` | Criar | R/W localStorage (tracks + notes) |
| `src/utils/__tests__/favStorage.test.ts` | Criar | Testes das funções de storage |
| `src/utils/favCookie.ts` | Criar | R/W `document.cookie` |
| `src/utils/__tests__/favCookie.test.ts` | Criar | Testes das funções de cookie |
| `src/utils/favHydration.ts` | Criar | Fetch one-shot de tracks ausentes |
| `src/hooks/useSpoterPlaylist.ts` | Mod | Local-first, refs, updateNote |
| `src/hooks/__tests__/useSpoterPlaylist.test.ts` | Mod | Atualizar testes para nova interface |
| `src/components/vinyl/ArcCarousel.tsx` | Mod | paint-order no arc title |
| `src/components/vinyl/ArcTextOverlay.tsx` | Criar | SVG arc text estático reutilizável |
| `src/components/vinyl/VinylDisk.tsx` | Mod | Prop `favoriteLabel` |
| `src/components/vinyl/PersistentVinylDisk.tsx` | Mod | Detectar favorito, passar label |
| `src/components/favorites/TrackAutocomplete.tsx` | Criar | Autocomplete isolado, Controller-ready |
| `src/components/favorites/AddFavoriteForm.tsx` | Criar | Formulário rhf+Zod |
| `src/components/favorites/NoteField.tsx` | Criar | Edição inline de nota |
| `src/pages/Favorites.tsx` | Mod | Usar AddFavoriteForm + NoteField |

---

## Task 1: i18n — Novas strings

**Files:**
- Modify: `src/locales/pt-BR.json`
- Modify: `src/locales/en-US.json`

- [ ] **Adicionar chaves ao `pt-BR.json` na seção `"favorites"`**

Adicionar após `"removedFromList": "Removida!"`:

```json
"trackRequired": "Selecione uma música",
"noteTooLong": "Máximo de 300 caracteres",
"alreadyFavorite": "Já está nos favoritos",
"notePlaceholder": "Uma nota pessoal (opcional)...",
"noteLabel": "Nota pessoal",
"trackLabel": "Música",
"addConfirm": "Adicionar ao favorito",
"searchAutocomplete": "Buscar música ou artista...",
"isFavorite": "♥ FAVORITO",
"noteCharsLeft": "{{count}}/300",
"editNote": "Editar nota",
"clearTrack": "Limpar seleção"
```

Adicionar na seção `"common"` após `"name"`:

```json
"clear": "Limpar"
```

- [ ] **Adicionar chaves ao `en-US.json` na seção `"favorites"`**

Adicionar após `"removedFromList": "Removed!"`:

```json
"trackRequired": "Select a song",
"noteTooLong": "Maximum 300 characters",
"alreadyFavorite": "Already in favorites",
"notePlaceholder": "A personal note (optional)...",
"noteLabel": "Personal note",
"trackLabel": "Song",
"addConfirm": "Add to favorites",
"searchAutocomplete": "Search song or artist...",
"isFavorite": "♥ FAVORITE",
"noteCharsLeft": "{{count}}/300",
"editNote": "Edit note",
"clearTrack": "Clear selection"
```

Adicionar na seção `"common"` após `"name"`:

```json
"clear": "Clear"
```

- [ ] **Verificar build**

```bash
yarn build 2>&1 | tail -5
```

Esperado: sem erros de TypeScript.

- [ ] **Commit**

```bash
git add src/locales/
git commit -m "feat(i18n): adiciona strings de favoritos local-first"
```

---

## Task 2: `favStorage.ts` — Funções puras de localStorage

**Files:**
- Create: `src/utils/favStorage.ts`
- Create: `src/utils/__tests__/favStorage.test.ts`

- [ ] **Criar `src/utils/favStorage.ts`**

```ts
import type { SpotifyTrack } from '@/types/spotify'

const tracksKey = (userId: string) => `spoter_favorites_${userId}`
const notesKey = (userId: string) => `spoter_fav_notes_${userId}`

export function readLocalTracks(userId: string): SpotifyTrack[] {
  try {
    const raw = localStorage.getItem(tracksKey(userId))
    return raw ? (JSON.parse(raw) as SpotifyTrack[]) : []
  } catch {
    return []
  }
}

export function writeLocalTracks(userId: string, tracks: SpotifyTrack[]): void {
  try {
    localStorage.setItem(tracksKey(userId), JSON.stringify(tracks))
  } catch { /* quota exceeded */ }
}

export function readLocalNotes(userId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(notesKey(userId))
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

export function writeLocalNotes(userId: string, notes: Record<string, string>): void {
  try {
    localStorage.setItem(notesKey(userId), JSON.stringify(notes))
  } catch { /* quota exceeded */ }
}
```

- [ ] **Escrever testes em `src/utils/__tests__/favStorage.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  readLocalTracks,
  writeLocalTracks,
  readLocalNotes,
  writeLocalNotes,
} from '@/utils/favStorage'
import type { SpotifyTrack } from '@/types/spotify'

const mockTrack = (id: string): SpotifyTrack =>
  ({
    id,
    uri: `spotify:track:${id}`,
    name: `Track ${id}`,
    duration_ms: 180000,
    explicit: false,
    popularity: 50,
    preview_url: null,
    type: 'track',
    artists: [{ id: 'a1', name: 'Artista', uri: 'spotify:artist:a1', type: 'artist' }],
    album: {
      id: 'alb1',
      name: 'Álbum',
      images: [{ url: 'https://img.example.com/1.jpg', width: 300, height: 300 }],
      release_date: '2024-01-01',
      album_type: 'album',
      artists: [],
      uri: 'spotify:album:alb1',
      type: 'album',
    },
  }) as SpotifyTrack

beforeEach(() => localStorage.clear())

describe('readLocalTracks', () => {
  it('retorna [] quando não há dados', () => {
    expect(readLocalTracks('u1')).toEqual([])
  })

  it('retorna [] quando o JSON está corrompido', () => {
    localStorage.setItem('spoter_favorites_u1', '{broken}')
    expect(readLocalTracks('u1')).toEqual([])
  })

  it('retorna as tracks salvas', () => {
    writeLocalTracks('u1', [mockTrack('t1'), mockTrack('t2')])
    const result = readLocalTracks('u1')
    expect(result).toHaveLength(2)
    expect(result[0].uri).toBe('spotify:track:t1')
  })

  it('isola por userId', () => {
    writeLocalTracks('u1', [mockTrack('t1')])
    expect(readLocalTracks('u2')).toHaveLength(0)
  })
})

describe('writeLocalTracks', () => {
  it('sobrescreve tracks anteriores', () => {
    writeLocalTracks('u1', [mockTrack('t1')])
    writeLocalTracks('u1', [mockTrack('t2'), mockTrack('t3')])
    expect(readLocalTracks('u1')).toHaveLength(2)
  })
})

describe('readLocalNotes', () => {
  it('retorna {} quando não há dados', () => {
    expect(readLocalNotes('u1')).toEqual({})
  })

  it('retorna notas salvas', () => {
    writeLocalNotes('u1', { 'spotify:track:t1': 'ouço no treino' })
    expect(readLocalNotes('u1')['spotify:track:t1']).toBe('ouço no treino')
  })
})

describe('writeLocalNotes', () => {
  it('persiste e recupera corretamente', () => {
    const notes = { 'spotify:track:x': 'nota x', 'spotify:track:y': 'nota y' }
    writeLocalNotes('u1', notes)
    expect(readLocalNotes('u1')).toEqual(notes)
  })
})
```

- [ ] **Rodar testes**

```bash
yarn test src/utils/__tests__/favStorage.test.ts
```

Esperado: 8 testes passando.

- [ ] **Commit**

```bash
git add src/utils/favStorage.ts src/utils/__tests__/favStorage.test.ts
git commit -m "feat: adiciona utilitários de storage para favoritos"
```

---

## Task 3: `favCookie.ts` — Funções puras de cookie

**Files:**
- Create: `src/utils/favCookie.ts`
- Create: `src/utils/__tests__/favCookie.test.ts`

- [ ] **Criar `src/utils/favCookie.ts`**

```ts
export interface FavCookieEntry {
  uri: string
  note: string
}

// ─── EDITAR AQUI: limites do cookie ──────────────────────────────────────────
const NOTE_TRUNCATE = 80       // chars máximos da nota no cookie
const COOKIE_BYTE_LIMIT = 3500 // bytes antes de omitir notas
// ─────────────────────────────────────────────────────────────────────────────

const cookieKey = (userId: string) => `spoter_fav_v1_${userId}`

export function readFavCookie(userId: string): FavCookieEntry[] {
  const key = cookieKey(userId)
  const pair = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${key}=`))
  if (!pair) return []
  try {
    return JSON.parse(decodeURIComponent(pair.slice(key.length + 1))) as FavCookieEntry[]
  } catch {
    return []
  }
}

export function writeFavCookie(userId: string, entries: FavCookieEntry[]): void {
  const withNotes = entries.map((e) => ({
    uri: e.uri,
    note: e.note.slice(0, NOTE_TRUNCATE),
  }))

  let payload = JSON.stringify(withNotes)

  if (new Blob([payload]).size > COOKIE_BYTE_LIMIT) {
    payload = JSON.stringify(entries.map((e) => ({ uri: e.uri, note: '' })))
  }

  const key = cookieKey(userId)
  document.cookie = `${key}=${encodeURIComponent(payload)}; max-age=31536000; path=/; SameSite=Strict`
}
```

- [ ] **Escrever testes em `src/utils/__tests__/favCookie.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { readFavCookie, writeFavCookie } from '@/utils/favCookie'
import type { FavCookieEntry } from '@/utils/favCookie'

function clearCookies() {
  document.cookie.split(';').forEach((c) => {
    document.cookie = c.replace(/=.*/, '=;max-age=0;path=/')
  })
}

beforeEach(clearCookies)

const entry = (uri: string, note = ''): FavCookieEntry => ({ uri, note })

describe('readFavCookie', () => {
  it('retorna [] quando não há cookie', () => {
    expect(readFavCookie('u1')).toEqual([])
  })

  it('retorna entradas salvas', () => {
    writeFavCookie('u1', [entry('spotify:track:t1', 'ouço no gym')])
    const result = readFavCookie('u1')
    expect(result).toHaveLength(1)
    expect(result[0].uri).toBe('spotify:track:t1')
    expect(result[0].note).toBe('ouço no gym')
  })

  it('isola por userId', () => {
    writeFavCookie('u1', [entry('spotify:track:t1')])
    expect(readFavCookie('u2')).toHaveLength(0)
  })
})

describe('writeFavCookie', () => {
  it('trunca nota em 80 chars no cookie', () => {
    const longa = 'a'.repeat(120)
    writeFavCookie('u1', [entry('spotify:track:t1', longa)])
    const [saved] = readFavCookie('u1')
    expect(saved.note).toHaveLength(80)
  })

  it('sobrescreve cookie anterior', () => {
    writeFavCookie('u1', [entry('spotify:track:t1')])
    writeFavCookie('u1', [entry('spotify:track:t2')])
    const result = readFavCookie('u1')
    expect(result).toHaveLength(1)
    expect(result[0].uri).toBe('spotify:track:t2')
  })
})
```

- [ ] **Rodar testes**

```bash
yarn test src/utils/__tests__/favCookie.test.ts
```

Esperado: 5 testes passando.

- [ ] **Commit**

```bash
git add src/utils/favCookie.ts src/utils/__tests__/favCookie.test.ts
git commit -m "feat: adiciona utilitários de cookie para favoritos"
```

---

## Task 4: `favHydration.ts` — Fetch one-shot da API

**Files:**
- Create: `src/utils/favHydration.ts`

- [ ] **Criar `src/utils/favHydration.ts`**

```ts
import api from '@/lib/axios'
import type { SpotifyTrack } from '@/types/spotify'

// Limite da API Spotify: máximo 50 IDs por request
const SPOTIFY_BATCH_LIMIT = 50

export async function hydrateFromApi(uris: string[]): Promise<SpotifyTrack[]> {
  if (uris.length === 0) return []

  const ids = uris
    .map((uri) => uri.replace('spotify:track:', ''))
    .filter(Boolean)
    .slice(0, SPOTIFY_BATCH_LIMIT)

  try {
    const { data } = await api.get<{ tracks: (SpotifyTrack | null)[] }>('/tracks', {
      params: { ids: ids.join(',') },
    })
    return data.tracks.filter((t): t is SpotifyTrack => t !== null)
  } catch {
    return []
  }
}
```

- [ ] **Verificar TypeScript**

```bash
yarn build 2>&1 | grep -E "error|warning" | head -10
```

Esperado: sem erros.

- [ ] **Commit**

```bash
git add src/utils/favHydration.ts
git commit -m "feat: adiciona hidratação one-shot da API Spotify para favoritos"
```

---

## Task 5: Refatorar `useSpoterPlaylist`

**Files:**
- Modify: `src/hooks/useSpoterPlaylist.ts`
- Modify: `src/hooks/__tests__/useSpoterPlaylist.test.ts`

- [ ] **Reescrever `src/hooks/useSpoterPlaylist.ts`**

```ts
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import type { AxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useUserPlaylists } from '@/hooks/queries/useUserPlaylists'
import { useCreatePlaylist } from '@/hooks/mutations/useCreatePlaylist'
import { useUpdatePlaylist } from '@/hooks/mutations/useUpdatePlaylist'
import { useAddToPlaylist } from '@/hooks/mutations/useAddToPlaylist'
import { useRemoveFromPlaylist } from '@/hooks/mutations/useRemoveFromPlaylist'
import { useUploadPlaylistCover } from '@/hooks/mutations/useUploadPlaylistCover'
import { readLocalTracks, writeLocalTracks, readLocalNotes, writeLocalNotes } from '@/utils/favStorage'
import { readFavCookie, writeFavCookie } from '@/utils/favCookie'
import { hydrateFromApi } from '@/utils/favHydration'
import spoterListCover from '@/assets/spoterListCover'
import type { SpotifyTrack } from '@/types/spotify'

const LEGACY_KEY = 'spoter_playlist_id'
const storageKey = (userId: string) => `spoter_playlist_${userId}`
const coverKey = (userId: string) => `spoter_cover_v2_${userId}`

export function useSpoterPlaylist() {
  const { t } = useTranslation()
  const { state: authState } = useAuth()
  const userId = authState.profile?.id ?? ''
  const displayName = authState.profile?.display_name ?? ''

  const playlistName = useMemo(
    () =>
      displayName
        ? `${displayName.charAt(0).toUpperCase() + displayName.slice(1)}'s ${t('playlist.defaultName')}`
        : t('playlist.defaultName'),
    [displayName, t]
  )

  // ── Estado local (fonte de verdade para a lista) ──────────────────────────
  const [localTracks, setLocalTracks] = useState<SpotifyTrack[]>(() =>
    userId ? readLocalTracks(userId) : []
  )
  const [localNotes, setLocalNotes] = useState<Record<string, string>>(() =>
    userId ? readLocalNotes(userId) : {}
  )
  const [isHydrating, setIsHydrating] = useState(false)

  // Refs para escritas síncronas sem depender de stale closures
  const tracksRef = useRef(localTracks)
  const notesRef = useRef(localNotes)
  useEffect(() => { tracksRef.current = localTracks }, [localTracks])
  useEffect(() => { notesRef.current = localNotes }, [localNotes])

  // ── Gerenciamento da playlist Spotify ─────────────────────────────────────
  const [forcedId, setForcedId] = useState<string | null>(null)
  const createAttempted = useRef(false)
  const coverUploaded = useRef(false)
  const hydrationAttempted = useRef(false)

  const playlists = useUserPlaylists(!!userId)
  const createPlaylist = useCreatePlaylist()
  const updatePlaylist = useUpdatePlaylist()
  const uploadCover = useUploadPlaylistCover()
  const addMutation = useAddToPlaylist()
  const removeMutation = useRemoveFromPlaylist()

  // Migra chave legada (compartilhada) para chave por usuário
  useEffect(() => {
    if (!userId) return
    const key = storageKey(userId)
    if (!localStorage.getItem(key)) {
      const legacy = localStorage.getItem(LEGACY_KEY)
      if (legacy) {
        localStorage.setItem(key, legacy)
        localStorage.removeItem(LEGACY_KEY)
      }
    }
  }, [userId])

  const playlistId = useMemo(() => {
    if (forcedId !== null) return forcedId
    if (!userId) return ''
    const saved = localStorage.getItem(storageKey(userId))
    if (saved) return saved
    if (playlists.data) {
      const found = playlists.data.items.find((p) => p.name === playlistName)
      if (found) return found.id
    }
    return ''
  }, [forcedId, userId, playlists.data, playlistName])

  useEffect(() => {
    if (!userId || !playlistId) return
    const key = storageKey(userId)
    if (!localStorage.getItem(key)) localStorage.setItem(key, playlistId)
  }, [userId, playlistId])

  useEffect(() => {
    if (!playlists.isSuccess || playlistId || !userId || createAttempted.current) return
    createAttempted.current = true
    createPlaylist.mutate(
      { userId, name: playlistName },
      {
        onSuccess: (p) => {
          localStorage.setItem(storageKey(userId), p.id)
          setForcedId(p.id)
          uploadCover.mutate(
            { playlistId: p.id, base64Jpeg: spoterListCover },
            { onSuccess: () => localStorage.setItem(coverKey(userId), '1') }
          )
        },
        onError: () => { createAttempted.current = false },
      }
    )
  }, [playlists.isSuccess, playlistId, userId, playlistName, createPlaylist, uploadCover])

  const resetStalePlaylist = (uid: string) => {
    localStorage.removeItem(storageKey(uid))
    createAttempted.current = false
    coverUploaded.current = false
    setForcedId(null)
  }

  useEffect(() => {
    if (!playlists.isSuccess || !playlistId || !userId) return
    const existing = playlists.data?.items.find((p) => p.id === playlistId)
    if (!existing) {
      setTimeout(() => resetStalePlaylist(userId), 0)
      return
    }
    if (displayName && existing.name !== playlistName) {
      updatePlaylist.mutate({ playlistId, name: playlistName })
    }
    if (!coverUploaded.current && !localStorage.getItem(coverKey(userId))) {
      coverUploaded.current = true
      uploadCover.mutate(
        { playlistId, base64Jpeg: spoterListCover },
        {
          onSuccess: () => localStorage.setItem(coverKey(userId), '1'),
          onError: () => { coverUploaded.current = false },
        }
      )
    }
  }, [playlists.isSuccess, playlistId, userId, displayName, playlistName, playlists.data, updatePlaylist, uploadCover])

  // ── Hidratação one-shot via cookie + API ──────────────────────────────────
  useEffect(() => {
    if (!userId || hydrationAttempted.current) return
    hydrationAttempted.current = true

    const cookieEntries = readFavCookie(userId)
    if (cookieEntries.length === 0) return

    const currentTracks = readLocalTracks(userId)
    const missingUris = cookieEntries
      .filter((e) => !currentTracks.some((t) => t.uri === e.uri))
      .map((e) => e.uri)

    if (missingUris.length === 0) return

    setIsHydrating(true)
    hydrateFromApi(missingUris).then((fetched) => {
      if (fetched.length > 0) {
        setLocalTracks((prev) => {
          const merged = [
            ...prev,
            ...fetched.filter((ft) => !prev.some((p) => p.uri === ft.uri)),
          ]
          writeLocalTracks(userId, merged)
          return merged
        })
      }
      setIsHydrating(false)
    })
  }, [userId])

  // ── Ações (escritas síncronas via refs) ───────────────────────────────────
  const addTrack = useCallback(
    (track: SpotifyTrack, note?: string) => {
      if (tracksRef.current.some((t) => t.uri === track.uri)) return

      const newTracks = [...tracksRef.current, track]
      const newNotes = note?.trim()
        ? { ...notesRef.current, [track.uri]: note.trim() }
        : notesRef.current

      writeLocalTracks(userId, newTracks)
      if (note?.trim()) writeLocalNotes(userId, newNotes)
      writeFavCookie(
        userId,
        newTracks.map((t) => ({ uri: t.uri, note: newNotes[t.uri] ?? '' }))
      )

      setLocalTracks(newTracks)
      if (note?.trim()) setLocalNotes(newNotes)

      if (playlistId) addMutation.mutate({ playlistId, uris: [track.uri] })
    },
    [userId, playlistId, addMutation]
  )

  const removeTrack = useCallback(
    (uri: string) => {
      const newTracks = tracksRef.current.filter((t) => t.uri !== uri)
      const newNotes = { ...notesRef.current }
      delete newNotes[uri]

      writeLocalTracks(userId, newTracks)
      writeLocalNotes(userId, newNotes)
      writeFavCookie(
        userId,
        newTracks.map((t) => ({ uri: t.uri, note: newNotes[t.uri] ?? '' }))
      )

      setLocalTracks(newTracks)
      setLocalNotes(newNotes)

      if (playlistId) removeMutation.mutate({ playlistId, uris: [uri] })
    },
    [userId, playlistId, removeMutation]
  )

  const updateNote = useCallback(
    (uri: string, note: string) => {
      const trimmed = note.trim()
      const newNotes = trimmed
        ? { ...notesRef.current, [uri]: trimmed }
        : (() => {
            const n = { ...notesRef.current }
            delete n[uri]
            return n
          })()

      writeLocalNotes(userId, newNotes)
      writeFavCookie(
        userId,
        tracksRef.current.map((t) => ({ uri: t.uri, note: newNotes[t.uri] ?? '' }))
      )

      setLocalNotes(newNotes)
    },
    [userId]
  )

  return {
    playlistId,
    playlistName,
    tracks: localTracks,
    notes: localNotes,
    addTrack,
    removeTrack,
    updateNote,
    isLoading: isHydrating && localTracks.length === 0,
  }
}
```

- [ ] **Atualizar `src/hooks/__tests__/useSpoterPlaylist.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/hooks/queries/useUserPlaylists', () => ({
  useUserPlaylists: () => ({
    isSuccess: true,
    data: { items: [{ id: 'pl-123', name: 'Spoter List' }] },
  }),
}))
vi.mock('@/hooks/mutations/useCreatePlaylist', () => ({
  useCreatePlaylist: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/mutations/useUpdatePlaylist', () => ({
  useUpdatePlaylist: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/mutations/useUploadPlaylistCover', () => ({
  useUploadPlaylistCover: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/mutations/useAddToPlaylist', () => ({
  useAddToPlaylist: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/mutations/useRemoveFromPlaylist', () => ({
  useRemoveFromPlaylist: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ state: { profile: { id: 'user-1', display_name: 'User' } } }),
}))
vi.mock('@/utils/favHydration', () => ({
  hydrateFromApi: vi.fn().mockResolvedValue([]),
}))

import { renderHook, act } from '@testing-library/react'
import { useSpoterPlaylist } from '@/hooks/useSpoterPlaylist'
import { writeLocalTracks } from '@/utils/favStorage'
import type { SpotifyTrack } from '@/types/spotify'

const mockTrack = (id: string): SpotifyTrack =>
  ({
    id,
    uri: `spotify:track:${id}`,
    name: `Track ${id}`,
    duration_ms: 180000,
    explicit: false,
    popularity: 50,
    preview_url: null,
    type: 'track',
    artists: [{ id: 'a1', name: 'Artista', uri: 'spotify:artist:a1', type: 'artist' }],
    album: {
      id: 'alb1', name: 'Álbum',
      images: [{ url: 'https://img.example.com/1.jpg', width: 300, height: 300 }],
      release_date: '2024-01-01', album_type: 'album', artists: [],
      uri: 'spotify:album:alb1', type: 'album',
    },
  }) as SpotifyTrack

beforeEach(() => {
  localStorage.clear()
  document.cookie.split(';').forEach((c) => {
    document.cookie = c.replace(/=.*/, '=;max-age=0;path=/')
  })
})

describe('useSpoterPlaylist', () => {
  it('encontra a playlist existente pelo nome', () => {
    const { result } = renderHook(() => useSpoterPlaylist())
    expect(result.current.playlistId).toBe('pl-123')
  })

  it('inicia com tracks do localStorage', () => {
    writeLocalTracks('user-1', [mockTrack('t1')])
    const { result } = renderHook(() => useSpoterPlaylist())
    expect(result.current.tracks).toHaveLength(1)
    expect(result.current.tracks[0].id).toBe('t1')
  })

  it('addTrack persiste no localStorage', () => {
    const { result } = renderHook(() => useSpoterPlaylist())
    act(() => { result.current.addTrack(mockTrack('t2')) })
    expect(result.current.tracks).toHaveLength(1)
    expect(result.current.tracks[0].id).toBe('t2')
  })

  it('addTrack ignora duplicata', () => {
    const { result } = renderHook(() => useSpoterPlaylist())
    act(() => {
      result.current.addTrack(mockTrack('t3'))
      result.current.addTrack(mockTrack('t3'))
    })
    expect(result.current.tracks).toHaveLength(1)
  })

  it('removeTrack remove a track', () => {
    const { result } = renderHook(() => useSpoterPlaylist())
    act(() => { result.current.addTrack(mockTrack('t4')) })
    act(() => { result.current.removeTrack('spotify:track:t4') })
    expect(result.current.tracks).toHaveLength(0)
  })

  it('updateNote salva e remove nota', () => {
    const { result } = renderHook(() => useSpoterPlaylist())
    act(() => { result.current.addTrack(mockTrack('t5')) })
    act(() => { result.current.updateNote('spotify:track:t5', 'ouço no gym') })
    expect(result.current.notes['spotify:track:t5']).toBe('ouço no gym')
    act(() => { result.current.updateNote('spotify:track:t5', '') })
    expect(result.current.notes['spotify:track:t5']).toBeUndefined()
  })
})
```

- [ ] **Rodar testes**

```bash
yarn test src/hooks/__tests__/useSpoterPlaylist.test.ts
```

Esperado: 6 testes passando.

- [ ] **Commit**

```bash
git add src/hooks/useSpoterPlaylist.ts src/hooks/__tests__/useSpoterPlaylist.test.ts
git commit -m "refactor: useSpoterPlaylist local-first com cookie, nota e hidratação one-shot"
```

---

## Task 6: `ArcCarousel.tsx` — Fundo branco no arc title

**Files:**
- Modify: `src/components/vinyl/ArcCarousel.tsx`

- [ ] **Adicionar `paintOrder`, `stroke` branco e `strokeLinejoin` ao `<text>` existente**

Localizar o bloco `<text>` atual (linha ~101) e substituir por:

```tsx
<text
  fontSize="11"
  fill="rgba(0,0,0,0.5)"
  fontWeight="600"
  letterSpacing="1.5"
  fontFamily="monospace"
  paintOrder="stroke fill"
  stroke="white"
  strokeWidth="8"
  strokeLinejoin="round"
>
  <textPath href={`#arc-${uid}`} startOffset="50%" textAnchor="middle">
    {title.toUpperCase()}
  </textPath>
</text>
```

- [ ] **Verificar build**

```bash
yarn build 2>&1 | tail -5
```

Esperado: sem erros.

- [ ] **Commit**

```bash
git add src/components/vinyl/ArcCarousel.tsx
git commit -m "fix: adiciona fundo branco no arc title do ArcCarousel via paint-order"
```

---

## Task 7: `ArcTextOverlay.tsx` — Componente SVG de arc text

**Files:**
- Create: `src/components/vinyl/ArcTextOverlay.tsx`

- [ ] **Criar `src/components/vinyl/ArcTextOverlay.tsx`**

```tsx
import { useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ArcTextOverlayProps {
  label: string
  diskPx: number
  // ─── EDITAR AQUI: geometria do arco ───────────────────────────────────────
  k?: number       // fração do raio do disco (0.0 – 1.0). Padrão: 0.88
  arcDeg?: number  // graus abrangidos pelo arco. Padrão: 120
  // ──────────────────────────────────────────────────────────────────────────
}

export function ArcTextOverlay({ label, diskPx, k = 0.88, arcDeg = 120 }: ArcTextOverlayProps) {
  const uid = useId()

  const cx = diskPx / 2
  const cy = diskPx / 2
  const r = (diskPx / 2) * k
  const halfRad = (arcDeg / 2) * (Math.PI / 180)

  // Arco centrado no topo do disco (270° no sistema SVG onde y cresce para baixo)
  const startAngleRad = (270 - arcDeg / 2) * (Math.PI / 180)
  const endAngleRad = (270 + arcDeg / 2) * (Math.PI / 180)

  const x1 = cx + r * Math.cos(startAngleRad)
  const y1 = cy + r * Math.sin(startAngleRad)
  const x2 = cx + r * Math.cos(endAngleRad)
  const y2 = cy + r * Math.sin(endAngleRad)

  const arcPath = `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`

  return (
    <AnimatePresence>
      <motion.svg
        key="arc-overlay"
        width={diskPx}
        height={diskPx}
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        style={{ overflow: 'visible' }}
        aria-hidden
      >
        <defs>
          <path id={`arc-fav-${uid}`} d={arcPath} />
        </defs>
        <text
          fontSize="11"
          fontWeight="700"
          letterSpacing="2"
          fontFamily="monospace"
          fill="rgba(0,0,0,0.6)"
          paintOrder="stroke fill"
          stroke="white"
          strokeWidth="10"
          strokeLinejoin="round"
        >
          <textPath
            href={`#arc-fav-${uid}`}
            startOffset="50%"
            textAnchor="middle"
          >
            {label.toUpperCase()}
          </textPath>
        </text>
      </motion.svg>
    </AnimatePresence>
  )
}
```

- [ ] **Verificar TypeScript**

```bash
yarn build 2>&1 | grep "error" | head -5
```

Esperado: sem erros.

- [ ] **Commit**

```bash
git add src/components/vinyl/ArcTextOverlay.tsx
git commit -m "feat: cria componente ArcTextOverlay para arc text estático sobre disco"
```

---

## Task 8: `VinylDisk.tsx` — Prop `favoriteLabel`

**Files:**
- Modify: `src/components/vinyl/VinylDisk.tsx`

- [ ] **Adicionar prop e renderizar `ArcTextOverlay`**

Substituir a interface `VinylDiskProps` e o corpo da função:

```tsx
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ArcTextOverlay } from './ArcTextOverlay'
import vinylWebp from '@/assets/vinyl.webp'

interface VinylDiskProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  albumArt?: string
  albumName?: string
  isPlaying?: boolean
  className?: string
  favoriteLabel?: string
}

const SIZE_MAP = { xs: 44, sm: 180, md: 360, lg: 560, xl: 720 } as const

export function VinylDisk({
  size = 'md',
  albumArt,
  albumName,
  isPlaying = false,
  className,
  favoriteLabel,
}: VinylDiskProps) {
  const px = SIZE_MAP[size]
  const { t } = useTranslation()

  const transition = isPlaying
    ? { duration: 8, ease: 'linear', repeat: Infinity }
    : { duration: 1.2, ease: 'easeOut' }

  const animation = { rotate: isPlaying ? 360 : 0 }

  return (
    <div
      className={`relative select-none shrink-0 ${className ?? ''}`}
      style={{ width: px, height: px, maxWidth: '100vw', maxHeight: '100vw' }}
    >
      <motion.img
        src={vinylWebp}
        alt=""
        draggable={false}
        className="w-full h-full object-cover rounded-full"
        animate={animation}
        transition={transition}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="relative rounded-full overflow-hidden"
          style={{ width: '26%', height: '26%' }}
        >
          <motion.img
            src={albumArt ?? '/spoter-logo-cor-small.svg'}
            alt={albumName ? `${t('favorites.album')}: ${albumName}` : ''}
            className="w-full h-full object-cover"
            animate={animation}
            transition={transition}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2"
            style={{ width: '10%', height: '10%' }}
          >
            <div className="w-full h-full bg-white/50 backdrop-blur-sm rounded-full border-black/20" />
          </div>
        </div>
      </div>

      {favoriteLabel && px >= 180 && (
        <ArcTextOverlay label={favoriteLabel} diskPx={px} />
      )}
    </div>
  )
}
```

> **Nota:** `px >= 180` — o arc label só aparece em discos médios ou maiores. Em `xs` (44px) não cabe.

- [ ] **Rodar testes existentes para verificar regressão**

```bash
yarn test
```

Esperado: todos os testes passando.

- [ ] **Commit**

```bash
git add src/components/vinyl/VinylDisk.tsx
git commit -m "feat: VinylDisk aceita favoriteLabel e exibe ArcTextOverlay"
```

---

## Task 9: `PersistentVinylDisk.tsx` — Detectar favorito

**Files:**
- Modify: `src/components/vinyl/PersistentVinylDisk.tsx`

- [ ] **Importar hook e passar `favoriteLabel`**

```tsx
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { VinylDisk } from './VinylDisk'
import { usePlayer } from '@/hooks/usePlayer'
import { readLocalTracks } from '@/utils/favStorage'
import { useAuth } from '@/hooks/useAuth'

const PLAYER_CLEARANCE = 136

function useVinylY() {
  const [vw, setVw] = useState(() => window.innerWidth)
  useEffect(() => {
    const fn = () => setVw(window.innerWidth)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  const diskPx = Math.min(720, vw)
  return {
    loginY: Math.round(diskPx * 0.5),
    homeY: Math.round(diskPx * 0.28),
    otherY: diskPx - PLAYER_CLEARANCE,
  }
}

interface PersistentVinylDiskProps {
  playerHovered?: boolean
}

export function PersistentVinylDisk({ playerHovered = false }: PersistentVinylDiskProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const { state } = usePlayer()
  const { state: authState } = useAuth()
  const { loginY, homeY, otherY } = useVinylY()

  const isLogin = location.pathname === '/login'
  const isHome = location.pathname === '/'

  const albumArt = state.currentTrack?.album.images[0]?.url
  const albumName = state.currentTrack?.album.name
  const y = isLogin ? loginY : isHome ? homeY : playerHovered ? homeY : otherY

  const userId = authState.profile?.id ?? ''
  const isFavorite =
    !!state.currentTrack &&
    !!userId &&
    readLocalTracks(userId).some((t) => t.uri === state.currentTrack!.uri)

  return (
    <div className="fixed inset-x-0 bottom-0 z-[3] pointer-events-none flex justify-center">
      <motion.div
        animate={{ y }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        initial={false}
      >
        <VinylDisk
          size="xl"
          isPlaying={state.isPlaying}
          albumArt={isLogin ? undefined : albumArt}
          albumName={isLogin ? undefined : albumName}
          favoriteLabel={isFavorite && !isLogin ? t('favorites.isFavorite') : undefined}
        />
      </motion.div>
    </div>
  )
}
```

- [ ] **Rodar testes**

```bash
yarn test
```

Esperado: todos passando.

- [ ] **Commit**

```bash
git add src/components/vinyl/PersistentVinylDisk.tsx
git commit -m "feat: PersistentVinylDisk exibe arc label quando a música é favorita"
```

---

## Task 10: `TrackAutocomplete.tsx` — Componente de autocomplete

**Files:**
- Create: `src/components/favorites/TrackAutocomplete.tsx`

- [ ] **Criar `src/components/favorites/TrackAutocomplete.tsx`**

```tsx
import { useState, useRef, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useSearchTracks } from '@/hooks/queries/useSearchTracks'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'
import type { SpotifyTrack } from '@/types/spotify'

export interface TrackAutocompleteProps {
  value: SpotifyTrack | null
  onChange: (track: SpotifyTrack | null) => void
  onBlur: () => void
  error?: string
}

export function TrackAutocomplete({ value, onChange, onBlur, error }: TrackAutocompleteProps) {
  const { t } = useTranslation()
  const uid = useId()
  const listboxId = `${uid}-listbox`

  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(query, 300)
  const { data: results = [], isPending } = useSearchTracks(debouncedQuery, debouncedQuery.length >= 2)

  const handleSelect = (track: SpotifyTrack) => {
    onChange(track)
    setQuery('')
    setIsOpen(false)
    setHighlightIndex(-1)
  }

  const handleClear = () => {
    onChange(null)
    setQuery('')
    setHighlightIndex(-1)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault()
      handleSelect(results[highlightIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setHighlightIndex(-1)
    }
  }

  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-black/5 rounded-xl">
        <img
          src={value.album.images[0]?.url}
          className="w-6 h-6 rounded object-cover shrink-0"
          alt=""
        />
        <span className="text-sm text-black flex-1 truncate">{value.name}</span>
        <span className="text-[11px] text-black/40 truncate hidden sm:block">
          {value.artists.map((a) => a.name).join(', ')}
        </span>
        <button
          type="button"
          onClick={handleClear}
          aria-label={t('favorites.clearTrack')}
          className="p-0.5 text-black/30 hover:text-black/70 transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        autoFocus
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen && results.length > 0}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-activedescendant={highlightIndex >= 0 ? `${listboxId}-${highlightIndex}` : undefined}
        placeholder={t('favorites.searchAutocomplete')}
        className={cn(
          'w-full px-3 py-2 bg-black/5 rounded-xl text-sm text-black',
          'placeholder:text-black/30 outline-none focus:bg-black/[0.08] transition-colors',
          error && 'ring-1 ring-red-400'
        )}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
          setHighlightIndex(-1)
        }}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
      />

      {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}

      {isPending && debouncedQuery.length >= 2 && (
        <div className="absolute top-full mt-1 left-0 right-0 glass rounded-xl p-3 z-50 shadow-xl">
          <p className="text-xs text-black/40 text-center">{t('common.loading')}</p>
        </div>
      )}

      {isOpen && results.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t('favorites.trackLabel')}
          className="absolute top-full mt-1 left-0 right-0 glass rounded-xl overflow-hidden z-50 shadow-xl"
        >
          {results.map((track, i) => (
            <li
              key={track.id}
              id={`${listboxId}-${i}`}
              role="option"
              aria-selected={i === highlightIndex}
              onClick={() => handleSelect(track)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors',
                i === highlightIndex ? 'bg-black/10' : 'hover:bg-black/5'
              )}
            >
              <img
                src={track.album.images[0]?.url}
                className="w-8 h-8 rounded-lg object-cover shrink-0"
                alt=""
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-black truncate">{track.name}</p>
                <p className="text-[11px] text-black/50 truncate">
                  {track.artists.map((a) => a.name).join(', ')}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Verificar build**

```bash
yarn build 2>&1 | grep "error" | head -5
```

Esperado: sem erros.

- [ ] **Commit**

```bash
git add src/components/favorites/TrackAutocomplete.tsx
git commit -m "feat: cria TrackAutocomplete desacoplado do rhf com acessibilidade"
```

---

## Task 11: `AddFavoriteForm.tsx` — Formulário rhf + Zod

**Files:**
- Create: `src/components/favorites/AddFavoriteForm.tsx`

- [ ] **Criar `src/components/favorites/AddFavoriteForm.tsx`**

```tsx
import { useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { TrackAutocomplete } from './TrackAutocomplete'
import { cn } from '@/lib/utils'
import type { SpotifyTrack } from '@/types/spotify'

interface AddFavoriteFormProps {
  tracks: SpotifyTrack[]
  onAdd: (track: SpotifyTrack, note?: string) => void
  onClose: () => void
}

type FormValues = { track: SpotifyTrack; note: string }

export function AddFavoriteForm({ tracks, onAdd, onClose }: AddFavoriteFormProps) {
  const { t } = useTranslation()

  const schema = useMemo(
    () =>
      z.object({
        track: z.custom<SpotifyTrack>(
          (val) => val !== null && typeof val === 'object' && 'uri' in val,
          { message: t('favorites.trackRequired') }
        ),
        note: z.string().max(300, t('favorites.noteTooLong')).default(''),
      }),
    [t]
  )

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { note: '' },
  })

  const watchedTrack = watch('track')
  const watchedNote = watch('note') ?? ''
  const isAlreadyFavorite =
    !!watchedTrack && tracks.some((t) => t.uri === watchedTrack.uri)
  const noteLength = watchedNote.length

  const onSubmit = handleSubmit(({ track, note }) => {
    onAdd(track, note.trim() || undefined)
    reset()
    onClose()
  })

  return (
    <form onSubmit={onSubmit} noValidate className="p-4 flex flex-col gap-4">
      <p className="text-xs font-semibold text-black/40 uppercase tracking-wide">
        {t('favorites.addHeading')}
      </p>

      {/* Campo: Música (autocomplete via Controller) */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-black/60">
          {t('favorites.trackLabel')}{' '}
          <span aria-hidden className="text-black/30">*</span>
        </label>
        <Controller
          name="track"
          control={control}
          render={({ field, fieldState }) => (
            <TrackAutocomplete
              value={field.value ?? null}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        {isAlreadyFavorite && (
          <p className="text-xs text-amber-500 ml-1" role="alert">
            {t('favorites.alreadyFavorite')}
          </p>
        )}
      </div>

      {/* Campo: Nota pessoal (register direto) */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-black/60">
          {t('favorites.noteLabel')}
        </label>
        <textarea
          {...register('note')}
          placeholder={t('favorites.notePlaceholder')}
          maxLength={320}
          rows={2}
          className="w-full px-3 py-2 bg-black/5 rounded-xl text-sm text-black placeholder:text-black/30 outline-none focus:bg-black/[0.08] transition-colors resize-none"
        />
        <div className="flex items-center justify-between">
          {errors.note ? (
            <p className="text-xs text-red-500">{errors.note.message}</p>
          ) : (
            <span />
          )}
          <span
            className={cn(
              'text-[11px] tabular-nums',
              noteLength > 280 ? 'text-red-500' : 'text-black/30'
            )}
          >
            {t('favorites.noteCharsLeft', { count: noteLength })}
          </span>
        </div>
      </div>

      {/* Botão de submit */}
      <button
        type="submit"
        disabled={!isValid || isSubmitting || isAlreadyFavorite}
        className="w-full py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {t('favorites.addConfirm')}
      </button>
    </form>
  )
}
```

- [ ] **Verificar build**

```bash
yarn build 2>&1 | grep "error" | head -5
```

Esperado: sem erros.

- [ ] **Commit**

```bash
git add src/components/favorites/AddFavoriteForm.tsx
git commit -m "feat: cria AddFavoriteForm com react-hook-form, Zod e autocomplete"
```

---

## Task 12: `NoteField.tsx` — Edição inline de nota

**Files:**
- Create: `src/components/favorites/NoteField.tsx`

- [ ] **Criar `src/components/favorites/NoteField.tsx`**

```tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NoteFieldProps {
  uri: string
  note: string
  onSave: (uri: string, note: string) => void
}

export function NoteField({ uri, note, onSave }: NoteFieldProps) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(note)

  const commit = () => {
    setEditing(false)
    onSave(uri, value.trim())
  }

  const cancel = () => {
    setValue(note)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') cancel()
        }}
        placeholder={t('favorites.notePlaceholder')}
        className="text-[11px] text-black/60 bg-transparent border-b border-black/20 outline-none w-full py-0.5"
      />
    )
  }

  return (
    <div className="flex items-center gap-1 group/note min-w-0">
      {note && (
        <span className="text-[11px] text-black/40 italic truncate">{note}</span>
      )}
      <button
        type="button"
        onClick={() => { setValue(note); setEditing(true) }}
        aria-label={t('favorites.editNote')}
        className={cn(
          'p-0.5 text-black/20 hover:text-black/50 transition-all shrink-0',
          note
            ? 'opacity-0 group-hover/note:opacity-100'
            : 'opacity-0 group-hover:opacity-100'
        )}
      >
        <Pencil size={10} />
      </button>
    </div>
  )
}
```

- [ ] **Verificar build**

```bash
yarn build 2>&1 | grep "error" | head -5
```

Esperado: sem erros.

- [ ] **Commit**

```bash
git add src/components/favorites/NoteField.tsx
git commit -m "feat: cria NoteField para edição inline de nota de favorito"
```

---

## Task 13: `Favorites.tsx` — Integração final

**Files:**
- Modify: `src/pages/Favorites.tsx`

- [ ] **Reescrever `src/pages/Favorites.tsx`**

```tsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { Music, Plus, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useSpoterPlaylist } from '@/hooks/useSpoterPlaylist'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { TrackRow } from '@/components/shared/TrackRow'
import { EmptyState } from '@/components/shared/EmptyState'
import { Tooltip } from '@/components/shared/Tooltip'
import { AddFavoriteForm } from '@/components/favorites/AddFavoriteForm'
import { NoteField } from '@/components/favorites/NoteField'
import { Trash2 } from 'lucide-react'

export function Favorites() {
  const { t } = useTranslation()
  const { tracks, notes, addTrack, removeTrack, updateNote, isLoading, playlistId, playlistName } =
    useSpoterPlaylist()
  const playTrack = usePlayTrack()
  const [open, setOpen] = useState(false)

  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      )
        close()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, close])

  // Fecha no Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, close])

  return (
    <div className="min-h-screen pt-16 px-4 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-6">
          <div>
            <h1 className="text-2xl font-black text-black">{t('nav.favorites')}</h1>
            <div className="mt-0.5">
              {playlistId ? (
                <Tooltip content={t('favorites.viewOnSpotify')}>
                  <a
                    href={`https://open.spotify.com/playlist/${playlistId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-black/40 font-medium hover:text-black/70 hover:underline transition-colors"
                  >
                    {playlistName}
                  </a>
                </Tooltip>
              ) : (
                <span className="text-sm text-black/40 font-medium">{playlistName}</span>
              )}
            </div>
          </div>

          {/* Botão + Popover */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-haspopup="true"
              className="flex items-center gap-2 px-4 py-2 glass rounded-full text-sm font-medium text-black/70 hover:bg-black/5 transition-colors"
            >
              <AnimatePresence mode="wait" initial={false}>
                {open ? (
                  <motion.span
                    key="x"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ display: 'flex' }}
                  >
                    <X size={16} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="plus"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ display: 'flex' }}
                  >
                    <Plus size={16} />
                  </motion.span>
                )}
              </AnimatePresence>
              {open ? t('favorites.close') : t('favorites.addButton')}
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  ref={popoverRef}
                  className="absolute top-[calc(100%+8px)] right-0 w-80 glass rounded-2xl shadow-xl overflow-hidden z-30"
                  initial={{ opacity: 0, scale: 0.92, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -6 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28, mass: 0.6 }}
                  style={{ transformOrigin: 'top right' }}
                >
                  <AddFavoriteForm tracks={tracks} onAdd={addTrack} onClose={close} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Lista de favoritos */}
        {isLoading && (
          <div className="space-y-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-black/10 shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="h-3 rounded-full bg-black/10" style={{ width: `${55 + ((i * 17) % 35)}%` }} />
                  <div className="h-2.5 rounded-full bg-black/[0.06]" style={{ width: `${30 + ((i * 11) % 25)}%` }} />
                </div>
                <div className="w-7 h-3 rounded-full bg-black/[0.06] shrink-0" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && tracks.length === 0 && (
          <EmptyState message={t('favorites.emptyList')} icon={<Music size={32} />} />
        )}

        {!isLoading && tracks.length > 0 && (
          <div className="space-y-1">
            {tracks.map((track) => (
              <div key={track.id} className="flex items-center group">
                <div className="flex-1 min-w-0">
                  <TrackRow track={track} isActive={false} onPlay={playTrack} />
                  <div className="px-3 pb-1">
                    <NoteField
                      uri={track.uri}
                      note={notes[track.uri] ?? ''}
                      onSave={updateNote}
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeTrack(track.uri)}
                  className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 shrink-0"
                  aria-label={t('favorites.removeConfirm')}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Rodar todos os testes**

```bash
yarn test
```

Esperado: todos os testes passando.

- [ ] **Verificar build de produção**

```bash
yarn build 2>&1 | tail -10
```

Esperado: build concluído sem erros.

- [ ] **Commit**

```bash
git add src/pages/Favorites.tsx
git commit -m "feat: integra AddFavoriteForm e NoteField na tela de favoritos"
```

---

## Self-review

**Cobertura da spec:**

| Requisito | Task |
|---|---|
| Cookie como bootstrap (leitura única) | Task 5 (hydrationAttempted ref) |
| localStorage como fonte entre telas | Task 5 (localTracks state init) |
| API one-shot para URIs ausentes | Tasks 4 + 5 |
| Track completo no storage ao adicionar | Task 5 (addTrack grava SpotifyTrack) |
| Nota pessoal (localStorage + cookie) | Tasks 2, 3, 5, 12, 13 |
| Nota truncada em 80 chars no cookie | Task 3 (NOTE_TRUNCATE = 80) |
| updateNote sem tocar API Spotify | Task 5 (updateNote) |
| Arc label no VinylDisk | Tasks 7, 8, 9 |
| Fundo branco no arc text | Tasks 6 (ArcCarousel) + 7 (ArcTextOverlay paint-order) |
| Bloco EDITAR AQUI na geometria | Task 7 (ArcTextOverlay props + comentário) |
| Formulário rhf + Zod | Task 11 |
| z.custom para campo track | Task 11 |
| Controller para autocomplete | Task 11 |
| mode: 'onChange' + formState.isValid | Task 11 |
| Guard de duplicata via watch | Task 11 |
| Autocomplete desacoplado do rhf | Task 10 |
| Navegação por teclado no autocomplete | Task 10 |
| aria-* no autocomplete | Task 10 |
| Nota inline com lápis hover | Task 12 |
| onBlur para salvar nota | Task 12 |
| Toda string via t() | Tasks 1, 10, 11, 12, 13 |
| Separação utils / hook / componente | Tasks 2-4 (utils), 5 (hook), 10-13 (componentes) |
