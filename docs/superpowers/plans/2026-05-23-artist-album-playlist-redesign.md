# Artist/Album/Playlist Redesign — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar ArtistDetail (foto + arco SVG + discografia com tabela + bio + related artists) e criar AlbumDetail e PlaylistDetail com header visual, lista/tabela de faixas e gráficos de audio features.

**Architecture:** Páginas separadas (ArtistDetail, AlbumDetail, PlaylistDetail) que compõem sub-componentes compartilhados (ListTableSwitch, TrackTable, AlbumTable, MusicalProfileCharts, CollectionHeader, ArtistHeroSection). Navegação inteligente via `location.state.from`.

**Tech Stack:** React 19, TypeScript, react-router-dom v6, @tanstack/react-query v5, framer-motion, recharts (já instalado), Tailwind CSS, i18next, Vitest + Testing Library + MSW

---

## Mapa de arquivos

**Criar:**
- `src/utils/audioFeatures.ts` — utilitário `averageAudioFeatures`
- `src/hooks/queries/useAlbum.ts`
- `src/hooks/queries/useAlbumTracks.ts`
- `src/hooks/queries/usePlaylist.ts`
- `src/hooks/queries/useRelatedArtists.ts`
- `src/hooks/queries/useArtistBio.ts`
- `src/hooks/queries/useTrackWikipedia.ts`
- `src/components/shared/ListTableSwitch.tsx`
- `src/components/shared/TrackTable.tsx`
- `src/components/shared/AlbumTable.tsx`
- `src/components/shared/MusicalProfileCharts.tsx`
- `src/components/shared/CollectionHeader.tsx`
- `src/components/artist/ArtistHeroSection.tsx`
- `src/components/artist/ArtistBio.tsx`
- `src/components/artist/RelatedArtists.tsx`
- `src/pages/AlbumDetail.tsx`
- `src/pages/PlaylistDetail.tsx`

**Modificar:**
- `src/types/spotify.ts` — +SpotifyAlbumFull, SpotifyAlbumTrack, RelatedArtistsResponse
- `src/hooks/queries/usePlaylistTracks.ts` — aceitar page + limit
- `src/components/layout/TrackInfoPanel.tsx` — extrair MusicalProfileCharts + seção Wikipedia
- `src/pages/ArtistDetail.tsx` — refatoração completa
- `src/components/shared/ArtistCard.tsx` — passar state.from na navegação
- `src/router.tsx` — +rotas album/playlist
- `src/locales/pt-BR.json` — novas chaves
- `src/locales/en-US.json` — novas chaves

**Testes criar:**
- `src/utils/__tests__/audioFeatures.test.ts`
- `src/components/shared/__tests__/ListTableSwitch.test.tsx`

---

## Task 1: Tipos + utilitário audioFeatures

**Files:**
- Modify: `src/types/spotify.ts`
- Create: `src/utils/audioFeatures.ts`
- Create: `src/utils/__tests__/audioFeatures.test.ts`

- [ ] **1.1 Escrever teste**

```ts
// src/utils/__tests__/audioFeatures.test.ts
import { describe, it, expect } from 'vitest'
import { averageAudioFeatures } from '../audioFeatures'
import type { AudioFeatures } from '@/types/spotify'

const makeFeature = (v: number): AudioFeatures => ({
  id: 'x', type: 'audio_features', uri: '', track_href: '', analysis_url: '',
  danceability: v, energy: v, valence: v, acousticness: v, speechiness: v,
  instrumentalness: v, liveness: v, loudness: v * -10, tempo: v * 100,
  duration_ms: 200000, key: 5, mode: 1, time_signature: 4,
})

describe('averageAudioFeatures', () => {
  it('retorna null para array vazio', () => {
    expect(averageAudioFeatures([])).toBeNull()
  })

  it('retorna o único item inalterado', () => {
    const f = makeFeature(0.6)
    const result = averageAudioFeatures([f])
    expect(result?.danceability).toBeCloseTo(0.6)
    expect(result?.energy).toBeCloseTo(0.6)
  })

  it('calcula média correta de múltiplos itens', () => {
    const result = averageAudioFeatures([makeFeature(0.2), makeFeature(0.8)])
    expect(result?.danceability).toBeCloseTo(0.5)
    expect(result?.energy).toBeCloseTo(0.5)
    expect(result?.tempo).toBeCloseTo(50)
  })
})
```

- [ ] **1.2 Rodar e confirmar FAIL**

```bash
cd /home/jean/spotify-player && npx vitest run src/utils/__tests__/audioFeatures.test.ts
```

Esperado: FAIL — `averageAudioFeatures` não existe.

- [ ] **1.3 Criar utilitário**

```ts
// src/utils/audioFeatures.ts
import type { AudioFeatures } from '@/types/spotify'

export function averageAudioFeatures(features: AudioFeatures[]): AudioFeatures | null {
  if (features.length === 0) return null
  const n = features.length
  const avg = (key: keyof AudioFeatures): number =>
    features.reduce((sum, f) => sum + (f[key] as number), 0) / n
  return {
    ...features[0],
    danceability:     avg('danceability'),
    energy:           avg('energy'),
    valence:          avg('valence'),
    acousticness:     avg('acousticness'),
    speechiness:      avg('speechiness'),
    instrumentalness: avg('instrumentalness'),
    liveness:         avg('liveness'),
    loudness:         avg('loudness'),
    tempo:            avg('tempo'),
  }
}
```

- [ ] **1.4 Rodar e confirmar PASS**

```bash
npx vitest run src/utils/__tests__/audioFeatures.test.ts
```

Esperado: 3 testes passando.

- [ ] **1.5 Adicionar tipos em spotify.ts**

Abrir `src/types/spotify.ts` e adicionar no final do arquivo:

```ts
export interface SpotifyAlbumTrack {
  id: string
  name: string
  duration_ms: number
  explicit: boolean
  track_number: number
  disc_number: number
  uri: string
  type: 'track'
  artists: SpotifyArtistSimple[]
  preview_url: string | null
  is_playable?: boolean
  href?: string
  external_urls?: SpotifyExternalUrls
}

export interface SpotifyAlbumFull extends SpotifyAlbumSimple {
  label?: string
  genres?: string[]
  popularity?: number
  copyrights?: Array<{ text: string; type: 'C' | 'P' }>
  external_ids?: { upc?: string; ean?: string }
}

export interface RelatedArtistsResponse {
  artists: SpotifyArtist[]
}

export type AlbumTracksResponse = PagingObject<SpotifyAlbumTrack>
```

- [ ] **1.6 Commit**

```bash
git add src/types/spotify.ts src/utils/audioFeatures.ts src/utils/__tests__/audioFeatures.test.ts
git commit -m "feat: add SpotifyAlbumFull/AlbumTrack types and averageAudioFeatures utility"
```

---

## Task 2: Hooks Spotify (useAlbum, useAlbumTracks, usePlaylist, useRelatedArtists)

**Files:**
- Create: `src/hooks/queries/useAlbum.ts`
- Create: `src/hooks/queries/useAlbumTracks.ts`
- Create: `src/hooks/queries/usePlaylist.ts`
- Create: `src/hooks/queries/useRelatedArtists.ts`
- Modify: `src/hooks/queries/usePlaylistTracks.ts`

Todos seguem o padrão dos hooks existentes (`useArtist`, `useArtistAlbums`): `useQuery` com `queryKey` + `enabled`.

- [ ] **2.1 Criar useAlbum**

```ts
// src/hooks/queries/useAlbum.ts
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SpotifyAlbumFull } from '@/types/spotify'

export function useAlbum(albumId: string | undefined) {
  return useQuery<SpotifyAlbumFull>({
    queryKey: ['album', albumId],
    enabled: !!albumId,
    queryFn: async () => {
      const { data } = await api.get<SpotifyAlbumFull>(`/albums/${albumId}`)
      return data
    },
  })
}
```

- [ ] **2.2 Criar useAlbumTracks**

```ts
// src/hooks/queries/useAlbumTracks.ts
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { AlbumTracksResponse } from '@/types/spotify'

export function useAlbumTracks(albumId: string | undefined, page: number, limit = 20) {
  return useQuery<AlbumTracksResponse>({
    queryKey: ['album-tracks', albumId, page, limit],
    enabled: !!albumId,
    queryFn: async () => {
      const { data } = await api.get<AlbumTracksResponse>(
        `/albums/${albumId}/tracks`,
        { params: { limit, offset: (page - 1) * limit, market: 'BR' } }
      )
      return data
    },
  })
}
```

- [ ] **2.3 Criar usePlaylist**

```ts
// src/hooks/queries/usePlaylist.ts
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SpotifyPlaylist } from '@/types/spotify'

export function usePlaylist(playlistId: string | undefined) {
  return useQuery<SpotifyPlaylist>({
    queryKey: ['playlist', playlistId],
    enabled: !!playlistId,
    queryFn: async () => {
      const { data } = await api.get<SpotifyPlaylist>(
        `/playlists/${playlistId}`,
        { params: { fields: 'id,name,description,images,owner,uri,public,snapshot_id,external_urls' } }
      )
      return data
    },
  })
}
```

- [ ] **2.4 Criar useRelatedArtists**

```ts
// src/hooks/queries/useRelatedArtists.ts
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { RelatedArtistsResponse, SpotifyArtist } from '@/types/spotify'

export function useRelatedArtists(artistId: string | undefined) {
  return useQuery<SpotifyArtist[]>({
    queryKey: ['related-artists', artistId],
    enabled: !!artistId,
    queryFn: async () => {
      const { data } = await api.get<RelatedArtistsResponse>(
        `/artists/${artistId}/related-artists`
      )
      return data.artists
    },
  })
}
```

- [ ] **2.5 Atualizar usePlaylistTracks para suportar paginação**

Substituir o conteúdo de `src/hooks/queries/usePlaylistTracks.ts`:

```ts
// src/hooks/queries/usePlaylistTracks.ts
import { useQuery } from '@tanstack/react-query'
import type { UseQueryOptions } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { PlaylistTracksResponse } from '@/types/spotify'

export function usePlaylistTracks(
  playlistId: string,
  enabled = true,
  page = 1,
  limit = 20,
  options?: Partial<UseQueryOptions<PlaylistTracksResponse, Error>>
) {
  return useQuery<PlaylistTracksResponse, Error>({
    ...options,
    queryKey: ['playlist-tracks', playlistId, page, limit],
    enabled: enabled && playlistId.length > 0,
    queryFn: async () => {
      const { data } = await api.get<PlaylistTracksResponse>(
        `/playlists/${playlistId}/items`,
        { params: { limit, offset: (page - 1) * limit } }
      )
      return data
    },
  })
}
```

> Nota: o `useSpoterPlaylist` chama `usePlaylistTracks` com assinatura `(id, enabled, options?)`. Com os novos parâmetros opcionais `page` e `limit` antes de `options`, isso quebra. Verificar e adaptar `useSpoterPlaylist.ts` para passar `page=1, limit=50` explicitamente se necessário.

- [ ] **2.6 Verificar useSpoterPlaylist**

```bash
grep -n "usePlaylistTracks" /home/jean/spotify-player/src/hooks/useSpoterPlaylist.ts
```

Se a chamada for `usePlaylistTracks(id, enabled, options)`, alterar para `usePlaylistTracks(id, enabled, 1, 50, options)`.

- [ ] **2.7 Commit**

```bash
git add src/hooks/queries/useAlbum.ts src/hooks/queries/useAlbumTracks.ts \
  src/hooks/queries/usePlaylist.ts src/hooks/queries/useRelatedArtists.ts \
  src/hooks/queries/usePlaylistTracks.ts src/hooks/useSpoterPlaylist.ts
git commit -m "feat: add useAlbum, useAlbumTracks, usePlaylist, useRelatedArtists hooks; update usePlaylistTracks pagination"
```

---

## Task 3: Wikipedia hooks (useArtistBio + useTrackWikipedia)

**Files:**
- Create: `src/hooks/queries/useArtistBio.ts`
- Create: `src/hooks/queries/useTrackWikipedia.ts`

Esses hooks usam `fetch` direto (não axios) pois chamam a Wikipedia, não a Spotify API.

- [ ] **3.1 Criar useArtistBio**

```ts
// src/hooks/queries/useArtistBio.ts
import { useQuery } from '@tanstack/react-query'

interface WikiResult {
  extract: string
  url: string
}

interface WikiSummary {
  extract?: string
  content_urls?: { desktop?: { page?: string } }
}

async function fetchWikipediaSummary(title: string): Promise<WikiResult | null> {
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  )
  if (!res.ok) return null
  const data: WikiSummary = await res.json()
  if (!data.extract) return null
  const extract = data.extract.length > 500
    ? data.extract.slice(0, 500) + '...'
    : data.extract
  return {
    extract,
    url: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
  }
}

export function useArtistBio(artistName: string | undefined) {
  return useQuery<WikiResult | null>({
    queryKey: ['artist-bio', artistName],
    enabled: !!artistName,
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      if (!artistName) return null
      const searchRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(artistName)}&limit=3&format=json&origin=*`
      )
      const [, titles] = await searchRes.json() as [string, string[], string[], string[]]
      const match = titles.find(t =>
        t.toLowerCase().includes(artistName.toLowerCase())
      )
      if (!match) return null
      return fetchWikipediaSummary(match)
    },
  })
}
```

- [ ] **3.2 Criar useTrackWikipedia**

```ts
// src/hooks/queries/useTrackWikipedia.ts
import { useQuery } from '@tanstack/react-query'

interface WikiResult {
  extract: string
  url: string
}

interface WikiSummary {
  extract?: string
  content_urls?: { desktop?: { page?: string } }
}

async function fetchWikipediaSummary(title: string): Promise<WikiResult | null> {
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  )
  if (!res.ok) return null
  const data: WikiSummary = await res.json()
  if (!data.extract) return null
  const extract = data.extract.length > 400
    ? data.extract.slice(0, 400) + '...'
    : data.extract
  return {
    extract,
    url: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
  }
}

export function useTrackWikipedia(trackName: string | undefined, artistName: string | undefined) {
  return useQuery<WikiResult | null>({
    queryKey: ['track-wikipedia', trackName, artistName],
    enabled: !!trackName && !!artistName,
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      if (!trackName || !artistName) return null
      const query = `${trackName} ${artistName} song`
      const searchRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&format=json&origin=*`
      )
      const [, titles] = await searchRes.json() as [string, string[], string[], string[]]
      const match = titles.find(t =>
        t.toLowerCase().includes(trackName.toLowerCase())
      )
      if (!match) return null
      return fetchWikipediaSummary(match)
    },
  })
}
```

- [ ] **3.3 Commit**

```bash
git add src/hooks/queries/useArtistBio.ts src/hooks/queries/useTrackWikipedia.ts
git commit -m "feat: add Wikipedia hooks for artist bio and track info"
```

---

## Task 4: Strings i18n

**Files:**
- Modify: `src/locales/pt-BR.json`
- Modify: `src/locales/en-US.json`

- [ ] **4.1 Adicionar chaves em pt-BR.json**

Adicionar no objeto `"artistDetail"`:
```json
"discography": "Discografia",
"bio": "Sobre o artista",
"relatedArtists": "Artistas Similares",
"loadMore": "Carregar mais",
"topTracksRanked": "Mais ouvidas",
"musicalProfile": "Perfil Musical",
"list": "Lista",
"table": "Tabela"
```

Adicionar novo objeto `"albumDetail"`:
```json
"albumDetail": {
  "playAlbum": "Tocar álbum",
  "tracks": "Faixas",
  "by": "por",
  "musicalProfile": "Perfil Musical"
}
```

Adicionar novo objeto `"playlistDetail"`:
```json
"playlistDetail": {
  "playPlaylist": "Tocar playlist",
  "tracks": "Faixas",
  "by": "por",
  "owner": "por {{name}}"
}
```

Adicionar em `"track"`:
```json
"bpm": "BPM",
"keyLabel": "Tom",
"explicit": "Explícito",
"trackNumber": "Nº",
"albumCol": "Álbum",
"artistCol": "Artista",
"releaseYear": "Ano",
"trackCount": "Faixas",
"type": "Tipo",
"aboutTrack": "Sobre a música",
"readMore": "Ler mais na Wikipedia"
```

- [ ] **4.2 Adicionar as mesmas chaves em en-US.json**

```json
// em "artistDetail":
"discography": "Discography",
"bio": "About the artist",
"relatedArtists": "Similar Artists",
"loadMore": "Load more",
"topTracksRanked": "Most played",
"musicalProfile": "Musical Profile",
"list": "List",
"table": "Table"

// novo objeto:
"albumDetail": {
  "playAlbum": "Play album",
  "tracks": "Tracks",
  "by": "by",
  "musicalProfile": "Musical Profile"
}

"playlistDetail": {
  "playPlaylist": "Play playlist",
  "tracks": "Tracks",
  "by": "by",
  "owner": "by {{name}}"
}

// em "track":
"bpm": "BPM",
"keyLabel": "Key",
"explicit": "Explicit",
"trackNumber": "#",
"albumCol": "Album",
"artistCol": "Artist",
"releaseYear": "Year",
"trackCount": "Tracks",
"type": "Type",
"aboutTrack": "About this track",
"readMore": "Read more on Wikipedia"
```

- [ ] **4.3 Commit**

```bash
git add src/locales/pt-BR.json src/locales/en-US.json
git commit -m "feat: add i18n keys for album/playlist/artist redesign"
```

---

## Task 5: ListTableSwitch

**Files:**
- Create: `src/components/shared/ListTableSwitch.tsx`
- Create: `src/components/shared/__tests__/ListTableSwitch.test.tsx`

- [ ] **5.1 Escrever teste**

```tsx
// src/components/shared/__tests__/ListTableSwitch.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ListTableSwitch } from '../ListTableSwitch'

describe('ListTableSwitch', () => {
  it('renderiza os dois botões', () => {
    render(<ListTableSwitch view="list" onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /lista/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tabela/i })).toBeInTheDocument()
  })

  it('chama onChange com "table" ao clicar em Tabela', async () => {
    const onChange = vi.fn()
    render(<ListTableSwitch view="list" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /tabela/i }))
    expect(onChange).toHaveBeenCalledWith('table')
  })

  it('chama onChange com "list" ao clicar em Lista', async () => {
    const onChange = vi.fn()
    render(<ListTableSwitch view="table" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /lista/i }))
    expect(onChange).toHaveBeenCalledWith('list')
  })
})
```

- [ ] **5.2 Rodar e confirmar FAIL**

```bash
npx vitest run src/components/shared/__tests__/ListTableSwitch.test.tsx
```

- [ ] **5.3 Criar componente**

```tsx
// src/components/shared/ListTableSwitch.tsx
import { List, Table2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ViewMode = 'list' | 'table'

interface ListTableSwitchProps {
  view: ViewMode
  onChange: (view: ViewMode) => void
  className?: string
}

export function ListTableSwitch({ view, onChange, className }: ListTableSwitchProps) {
  return (
    <div className={cn('inline-flex items-center gap-0.5 p-1 bg-black/5 rounded-xl', className)}>
      <button
        onClick={() => onChange('list')}
        aria-pressed={view === 'list'}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
          view === 'list'
            ? 'bg-white shadow-sm text-black'
            : 'text-black/40 hover:text-black/70'
        )}
      >
        <List size={13} />
        Lista
      </button>
      <button
        onClick={() => onChange('table')}
        aria-pressed={view === 'table'}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
          view === 'table'
            ? 'bg-white shadow-sm text-black'
            : 'text-black/40 hover:text-black/70'
        )}
      >
        <Table2 size={13} />
        Tabela
      </button>
    </div>
  )
}
```

- [ ] **5.4 Rodar e confirmar PASS**

```bash
npx vitest run src/components/shared/__tests__/ListTableSwitch.test.tsx
```

Esperado: 3 testes passando.

- [ ] **5.5 Commit**

```bash
git add src/components/shared/ListTableSwitch.tsx src/components/shared/__tests__/ListTableSwitch.test.tsx
git commit -m "feat: add ListTableSwitch component"
```

---

## Task 6: TrackTable + AlbumTable

**Files:**
- Create: `src/components/shared/TrackTable.tsx`
- Create: `src/components/shared/AlbumTable.tsx`

Sem testes de renderização separados nessa task — comportamento é coberto pelos testes de integração das páginas.

- [ ] **6.1 Criar TrackTable**

```tsx
// src/components/shared/TrackTable.tsx
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/utils/formatDuration'
import type { SpotifyTrack, SpotifyAlbumTrack, AudioFeatures } from '@/types/spotify'

const KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A♭', 'B']

interface TrackTableProps {
  tracks: (SpotifyTrack | SpotifyAlbumTrack)[]
  audioFeatures?: AudioFeatures[]
  showAlbumColumn?: boolean
  activeTrackId?: string
  onPlay?: (track: SpotifyTrack | SpotifyAlbumTrack) => void
  onAlbumClick?: (albumId: string) => void
}

export function TrackTable({
  tracks,
  audioFeatures,
  showAlbumColumn = true,
  activeTrackId,
  onPlay,
  onAlbumClick,
}: TrackTableProps) {
  const featureMap = audioFeatures
    ? Object.fromEntries(audioFeatures.map(f => [f.id, f]))
    : {}

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse" style={{ minWidth: 640 }}>
        <thead>
          <tr className="border-b border-black/8">
            <th className="text-left py-2 px-3 text-black/30 font-semibold w-8">#</th>
            <th className="text-left py-2 px-3 text-black/30 font-semibold w-10"></th>
            <th className="text-left py-2 px-3 text-black/30 font-semibold">Nome</th>
            <th className="text-left py-2 px-3 text-black/30 font-semibold">Artista</th>
            {showAlbumColumn && (
              <th className="text-left py-2 px-3 text-black/30 font-semibold">Álbum</th>
            )}
            <th className="text-right py-2 px-3 text-black/30 font-semibold">Duração</th>
            <th className="text-right py-2 px-3 text-black/30 font-semibold">Pop.</th>
            <th className="text-right py-2 px-3 text-black/30 font-semibold">BPM</th>
            <th className="text-right py-2 px-3 text-black/30 font-semibold">Tom</th>
            <th className="text-center py-2 px-3 text-black/30 font-semibold">E</th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track, i) => {
            const f = featureMap[track.id]
            const keyLabel = f && f.key >= 0
              ? `${KEY_NAMES[f.key]} ${f.mode === 1 ? 'M' : 'm'}`
              : null
            const albumImage = 'album' in track ? track.album.images[0]?.url : undefined
            const albumId = 'album' in track ? track.album.id : undefined
            const isActive = track.id === activeTrackId

            return (
              <tr
                key={track.id}
                className={cn(
                  'group hover:bg-black/4 transition-colors cursor-pointer',
                  isActive && 'bg-black/6'
                )}
                onClick={() => onPlay?.(track)}
              >
                <td className="py-2 px-3 text-black/30 tabular-nums">
                  <span className="group-hover:hidden">{i + 1}</span>
                  <button
                    className="hidden group-hover:flex items-center justify-center"
                    aria-label={`Tocar ${track.name}`}
                    onClick={e => { e.stopPropagation(); onPlay?.(track) }}
                  >
                    <Play size={11} className="fill-black text-black" />
                  </button>
                </td>
                <td className="py-2 px-3">
                  {albumImage && (
                    <img
                      src={albumImage}
                      alt=""
                      className="w-8 h-8 rounded-md object-cover"
                    />
                  )}
                </td>
                <td className="py-2 px-3 font-medium text-black/90 whitespace-nowrap max-w-[180px] truncate">
                  {track.name}
                </td>
                <td className="py-2 px-3 text-black/50 whitespace-nowrap">
                  {'artists' in track
                    ? track.artists.map(a => a.name).join(', ')
                    : '—'
                  }
                </td>
                {showAlbumColumn && (
                  <td className="py-2 px-3 text-black/50 whitespace-nowrap">
                    {albumId ? (
                      <button
                        className="hover:text-black hover:underline transition-colors"
                        onClick={e => { e.stopPropagation(); onAlbumClick?.(albumId) }}
                      >
                        {'album' in track ? track.album.name : '—'}
                      </button>
                    ) : '—'}
                  </td>
                )}
                <td className="py-2 px-3 text-right text-black/40 tabular-nums whitespace-nowrap">
                  {formatDuration(track.duration_ms)}
                </td>
                <td className="py-2 px-3 text-right text-black/40 tabular-nums">
                  {'popularity' in track ? track.popularity : '—'}
                </td>
                <td className="py-2 px-3 text-right text-black/40 tabular-nums">
                  {f ? Math.round(f.tempo) : '—'}
                </td>
                <td className="py-2 px-3 text-right text-black/40 whitespace-nowrap">
                  {keyLabel ?? '—'}
                </td>
                <td className="py-2 px-3 text-center">
                  {track.explicit && (
                    <span className="text-[8px] font-black bg-black/10 rounded px-1 py-0.5">E</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **6.2 Criar AlbumTable (discografia)**

```tsx
// src/components/shared/AlbumTable.tsx
import { cn } from '@/lib/utils'
import type { SpotifyAlbumSimple } from '@/types/spotify'

interface AlbumTableProps {
  albums: SpotifyAlbumSimple[]
  onClick: (album: SpotifyAlbumSimple) => void
}

export function AlbumTable({ albums, onClick }: AlbumTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse" style={{ minWidth: 500 }}>
        <thead>
          <tr className="border-b border-black/8">
            <th className="text-left py-2 px-3 text-black/30 font-semibold w-10"></th>
            <th className="text-left py-2 px-3 text-black/30 font-semibold">Nome</th>
            <th className="text-left py-2 px-3 text-black/30 font-semibold">Tipo</th>
            <th className="text-right py-2 px-3 text-black/30 font-semibold">Ano</th>
            <th className="text-right py-2 px-3 text-black/30 font-semibold">Faixas</th>
            <th className="text-right py-2 px-3 text-black/30 font-semibold">Pop.</th>
          </tr>
        </thead>
        <tbody>
          {albums.map(album => (
            <tr
              key={album.id}
              className="group hover:bg-black/4 transition-colors cursor-pointer"
              onClick={() => onClick(album)}
            >
              <td className="py-2 px-3">
                <img
                  src={album.images[0]?.url}
                  alt=""
                  className="w-8 h-8 rounded-md object-cover"
                />
              </td>
              <td className="py-2 px-3 font-medium text-black/90 whitespace-nowrap max-w-[200px] truncate">
                {album.name}
              </td>
              <td className="py-2 px-3 text-black/50 capitalize">{album.album_type}</td>
              <td className="py-2 px-3 text-right text-black/40 tabular-nums">
                {album.release_date?.slice(0, 4)}
              </td>
              <td className={cn('py-2 px-3 text-right text-black/40 tabular-nums')}>
                {album.total_tracks ?? '—'}
              </td>
              <td className="py-2 px-3 text-right text-black/40 tabular-nums">—</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **6.3 Commit**

```bash
git add src/components/shared/TrackTable.tsx src/components/shared/AlbumTable.tsx
git commit -m "feat: add TrackTable and AlbumTable components with horizontal scroll"
```

---

## Task 7: MusicalProfileCharts (extraído de TrackInfoPanel)

**Files:**
- Create: `src/components/shared/MusicalProfileCharts.tsx`
- Modify: `src/components/layout/TrackInfoPanel.tsx` (substituir seção existente pelo componente)

- [ ] **7.1 Criar MusicalProfileCharts**

O componente extrai a lógica de radar + feature bars que está em `TrackInfoPanel` (~linhas 70–238), adicionando suporte a `theme`.

```tsx
// src/components/shared/MusicalProfileCharts.tsx
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip,
} from 'recharts'
import type { AudioFeatures } from '@/types/spotify'

const KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A♭', 'B']

interface MusicalProfileChartsProps {
  features: AudioFeatures
  theme?: 'light' | 'dark'
}

export function MusicalProfileCharts({ features: f, theme = 'dark' }: MusicalProfileChartsProps) {
  const { t } = useTranslation()
  const dark = theme === 'dark'

  const labelColor = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)'
  const gridColor  = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const textColor  = dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.30)'
  const bgBar      = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const tooltipBg  = dark ? 'rgba(10,10,10,0.95)' : 'rgba(255,255,255,0.98)'
  const tooltipBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const tooltipText = dark ? '#fff' : '#000'

  const keyLabel = f.key >= 0
    ? `${KEY_NAMES[f.key]} ${f.mode === 1 ? t('track.major') : t('track.minor')}`
    : null

  const radarData = [
    { label: t('artistDetail.danceability'), v: Math.round(f.danceability * 100) },
    { label: t('artistDetail.energy'),       v: Math.round(f.energy * 100) },
    { label: t('artistDetail.valence'),      v: Math.round(f.valence * 100) },
    { label: t('artistDetail.acousticness'), v: Math.round(f.acousticness * 100) },
    { label: t('artistDetail.liveness'),     v: Math.round(f.liveness * 100) },
  ]

  const featureBars = [
    { key: 'danceability',     value: f.danceability,     color: '#1DB954', label: t('artistDetail.danceability') },
    { key: 'energy',           value: f.energy,           color: '#f97316', label: t('artistDetail.energy') },
    { key: 'valence',          value: f.valence,          color: '#fbbf24', label: t('track.valence') },
    { key: 'acousticness',     value: f.acousticness,     color: '#60a5fa', label: t('artistDetail.acousticness') },
    { key: 'speechiness',      value: f.speechiness,      color: '#a78bfa', label: t('track.speechiness') },
    { key: 'instrumentalness', value: f.instrumentalness, color: '#34d399', label: t('track.instrumentalness') },
    { key: 'liveness',         value: f.liveness,         color: '#fb7185', label: t('artistDetail.liveness') },
  ]

  return (
    <div className="w-full max-w-sm md:max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Radar */}
      <div>
        <p className="text-[9px] uppercase tracking-[0.2em] font-bold mb-4 text-center"
          style={{ color: textColor }}>
          {t('artistDetail.audioProfile')}
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData} outerRadius="72%">
            <PolarGrid stroke={gridColor} radialLines={false} />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fill: labelColor, fontSize: 9, fontWeight: 600 }}
            />
            <Radar
              dataKey="v"
              stroke="#1DB954"
              fill="#1DB954"
              fillOpacity={0.18}
              strokeWidth={1.5}
              animationBegin={200}
              animationDuration={900}
            />
            <Tooltip
              contentStyle={{
                background: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: 10,
                fontSize: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              }}
              itemStyle={{ color: tooltipText }}
              formatter={(v: number) => [`${v}%`, '']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Feature bars */}
      <div>
        <p className="text-[9px] uppercase tracking-[0.2em] font-bold mb-4 text-center"
          style={{ color: textColor }}>
          {t('track.audioFeatures')}
        </p>
        <div className="flex flex-col gap-3">
          {featureBars.map(({ key, value, color, label }, i) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-medium" style={{ color: labelColor }}>{label}</span>
                <span className="text-[10px] font-bold tabular-nums" style={{ color }}>
                  {Math.round(value * 100)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: bgBar }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${value * 100}%` }}
                  transition={{ duration: 0.7, delay: 0.1 + i * 0.07, ease: 'easeOut' }}
                  style={{ background: color, boxShadow: `0 0 6px ${color}66` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* BPM + Tonalidade como stat pills extras */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="flex flex-col p-2.5 rounded-xl" style={{ background: bgBar }}>
            <span className="text-[8px] uppercase tracking-widest font-bold mb-0.5" style={{ color: textColor }}>BPM</span>
            <span className="text-sm font-bold" style={{ color: dark ? '#fff' : '#000' }}>
              {Math.round(f.tempo)}
            </span>
          </div>
          <div className="flex flex-col p-2.5 rounded-xl" style={{ background: bgBar }}>
            <span className="text-[8px] uppercase tracking-widest font-bold mb-0.5" style={{ color: textColor }}>{t('track.key')}</span>
            <span className="text-sm font-bold" style={{ color: dark ? '#fff' : '#000' }}>
              {keyLabel ?? '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **7.2 Atualizar TrackInfoPanel para usar MusicalProfileCharts**

Em `src/components/layout/TrackInfoPanel.tsx`:

1. Adicionar import:
```tsx
import { MusicalProfileCharts } from '@/components/shared/MusicalProfileCharts'
```

2. Substituir o bloco `{/* Radar + Feature bars */}` (linhas ~177–239) por:
```tsx
<MusicalProfileCharts features={f} theme="dark" />
```

3. Remover as definições locais de `radarData` e `featureBars` (linhas ~70–86) pois agora ficam dentro de `MusicalProfileCharts`.

- [ ] **7.3 Verificar que o TrackInfoPanel ainda funciona**

```bash
npx vitest run
```

Todos os testes existentes devem continuar passando.

- [ ] **7.4 Commit**

```bash
git add src/components/shared/MusicalProfileCharts.tsx src/components/layout/TrackInfoPanel.tsx
git commit -m "feat: extract MusicalProfileCharts from TrackInfoPanel, add light/dark theme"
```

---

## Task 8: CollectionHeader

**Files:**
- Create: `src/components/shared/CollectionHeader.tsx`

O header compartilhado para AlbumDetail e PlaylistDetail. Usa `position:fixed` para a imagem sair do topo da tela, igual ao padrão do `ArtistDetail` atual.

- [ ] **8.1 Criar CollectionHeader**

```tsx
// src/components/shared/CollectionHeader.tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollectionHeaderProps {
  imageUrl: string | undefined
  name: string
  subtitle: string
  year?: string
  playLabel: string
  onPlay: () => void
  onBack: () => void
  onLayout: (height: number) => void
  className?: string
}

function useCollectionLayout() {
  const [vw, setVw] = useState(() => window.innerWidth)
  useEffect(() => {
    const fn = () => setVw(window.innerWidth)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const imgPx = Math.min(280, Math.round(vw * 0.65))
  const translateY = Math.round(imgPx * 0.25)
  // visible image height + name block (~100px) + button (~52px) + padding (32px)
  const headerHeight = imgPx - translateY + 184

  return { imgPx, translateY, headerHeight }
}

export function CollectionHeader({
  imageUrl,
  name,
  subtitle,
  year,
  playLabel,
  onPlay,
  onBack,
  onLayout,
}: CollectionHeaderProps) {
  const { imgPx, translateY, headerHeight } = useCollectionLayout()

  useEffect(() => {
    onLayout(headerHeight)
  }, [headerHeight, onLayout])

  return (
    <div className="fixed inset-x-0 top-0 z-[5] pointer-events-none">
      {/* Botão voltar */}
      <button
        onClick={onBack}
        className="pointer-events-auto absolute top-4 left-4 flex items-center gap-1 text-sm font-medium text-black/60 hover:text-black transition-colors z-10 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full"
      >
        <ChevronLeft size={16} />
        Voltar
      </button>

      {/* Imagem saindo do topo */}
      <div
        className="absolute left-1/2"
        style={{ transform: `translateX(-50%) translateY(-${translateY}px)`, top: 0 }}
      >
        <motion.div
          initial={{ scale: 0.8, y: 60, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="object-cover shadow-2xl"
              style={{
                width: imgPx,
                height: imgPx,
                borderRadius: imgPx * 0.12,
              }}
              draggable={false}
            />
          ) : (
            <div
              className="bg-black/10 flex items-center justify-center"
              style={{ width: imgPx, height: imgPx, borderRadius: imgPx * 0.12 }}
            >
              <span className="text-5xl text-black/20">♪</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Metadados + botão */}
      <motion.div
        className="absolute left-0 right-0 flex flex-col items-center pointer-events-auto"
        style={{ top: imgPx - translateY + 16 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <h1
          className="text-2xl font-black text-black text-center px-8 leading-tight"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {name}
        </h1>
        <p className="text-sm text-black/50 mt-1">
          {subtitle}{year ? ` · ${year}` : ''}
        </p>
        <button
          onClick={onPlay}
          className={cn(
            'mt-4 px-8 py-3 bg-black text-white text-sm font-bold rounded-full',
            'hover:bg-black/80 active:scale-95 transition-all shadow-lg'
          )}
        >
          {playLabel}
        </button>
      </motion.div>
    </div>
  )
}
```

- [ ] **8.2 Commit**

```bash
git add src/components/shared/CollectionHeader.tsx
git commit -m "feat: add CollectionHeader component for album/playlist pages"
```

---

## Task 9: ArtistHeroSection

**Files:**
- Create: `src/components/artist/ArtistHeroSection.tsx`

Encapsula: `useArtistLayout`, foto circular do artista, nome em arco SVG, botão voltar, ArcCarousel de top 5.

- [ ] **9.1 Criar diretório e componente**

```bash
mkdir -p /home/jean/spotify-player/src/components/artist
```

```tsx
// src/components/artist/ArtistHeroSection.tsx
import { useState, useEffect, useId } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { ArcCarousel } from '@/components/vinyl/ArcCarousel'
import { VinylCard } from '@/components/shared/VinylCard'
import type { SpotifyArtist, SpotifyTrack } from '@/types/spotify'

const DELAY = 0.3

function useArtistLayout() {
  const [vw, setVw] = useState(() => window.innerWidth)
  useEffect(() => {
    const fn = () => setVw(window.innerWidth)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const diskPx = Math.min(720, vw)
  const translateY = Math.round(diskPx * 0.28)
  const arcRadius = Math.max(130, Math.round(diskPx * 0.36))
  const arcDeg = vw < 768 ? 130 : 90
  const arcContainerTop = Math.max(80, diskPx - translateY - arcRadius - 20)
  const fixedZoneHeight = arcContainerTop + arcRadius + 60 + 80

  return { diskPx, translateY, arcRadius, arcDeg, arcContainerTop, fixedZoneHeight }
}

interface ArtistHeroSectionProps {
  artist: SpotifyArtist | undefined
  topTracks: SpotifyTrack[] | undefined
  activeTrackId?: string
  onTrackPlay: (track: SpotifyTrack) => void
  onBack: () => void
  onLayout: (fixedZoneHeight: number) => void
  carouselTitle: string
}

export function ArtistHeroSection({
  artist,
  topTracks,
  activeTrackId,
  onTrackPlay,
  onBack,
  onLayout,
  carouselTitle,
}: ArtistHeroSectionProps) {
  const uid = useId()
  const { diskPx, translateY, arcRadius, arcDeg, arcContainerTop, fixedZoneHeight } = useArtistLayout()

  useEffect(() => {
    onLayout(fixedZoneHeight)
  }, [fixedZoneHeight, onLayout])

  const artistImage = artist?.images[0]?.url

  // Arc text path around the bottom of the artist photo
  // Center of photo in local SVG coords: (diskPx/2, diskPx/2)
  // Text arc slightly outside the photo circle, at the bottom
  const cx = diskPx / 2
  const tR = diskPx / 2 + 32
  const arcHalf = (120 / 2) * (Math.PI / 180) // 120° arc, centered at bottom
  // Bottom arc: center at (cx, cx), sweep from bottom-left to bottom-right
  const ax1 = cx - tR * Math.sin(arcHalf)
  const ay1 = cx + tR * Math.cos(arcHalf)
  const ax2 = cx + tR * Math.sin(arcHalf)
  const ay2 = cx + tR * Math.cos(arcHalf)
  const nameArcPath = `M ${ax1} ${ay1} A ${tR} ${tR} 0 0 1 ${ax2} ${ay2}`

  // Back button position: at left end of arc (ax1, ay1 - translateY in viewport)
  const backBtnViewportX = (window.innerWidth - diskPx) / 2 + ax1
  const backBtnViewportY = ay1 - translateY

  return (
    <div className="fixed inset-0 pointer-events-none z-[5]">
      {/* Botão voltar — posicionado no arco esquerdo */}
      <motion.button
        onClick={onBack}
        className="pointer-events-auto absolute flex items-center justify-center w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm text-black/60 hover:text-black hover:bg-white/90 transition-all shadow-sm"
        style={{ left: Math.max(16, backBtnViewportX - 16), top: Math.max(16, backBtnViewportY - 16) }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
        aria-label="Voltar"
      >
        <ChevronLeft size={16} />
      </motion.button>

      {/* Foto circular do artista saindo do topo */}
      <div
        className="absolute top-0 left-1/2"
        style={{ transform: `translateX(-50%) translateY(-${translateY}px)` }}
      >
        <motion.div
          initial={{ scale: 0.7, y: 80, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
          style={{ width: diskPx, height: diskPx, position: 'relative' }}
        >
          {/* Foto do artista */}
          {artistImage ? (
            <img
              src={artistImage}
              alt={artist?.name}
              className="rounded-full object-cover w-full h-full"
              draggable={false}
            />
          ) : (
            <div className="rounded-full w-full h-full bg-black/10" />
          )}

          {/* Nome em arco SVG */}
          <motion.svg
            className="absolute inset-0 pointer-events-none overflow-visible"
            width={diskPx}
            height={diskPx}
            overflow="visible"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <defs>
              <path id={`name-arc-${uid}`} d={nameArcPath} />
            </defs>
            <text
              fontFamily="Inter, sans-serif"
              fontWeight="900"
              letterSpacing="3"
            >
              <textPath
                href={`#name-arc-${uid}`}
                startOffset="50%"
                textAnchor="middle"
                style={{ fontSize: Math.max(14, diskPx * 0.035) }}
                fill="rgba(0,0,0,0.85)"
              >
                {artist?.name?.toUpperCase() ?? ''}
              </textPath>
            </text>
          </motion.svg>
        </motion.div>
      </div>

      {/* ArcCarousel de top 5 */}
      <div
        className="absolute left-1/2 pointer-events-auto"
        style={{ top: arcContainerTop, transform: 'translateX(-50%)' }}
      >
        {topTracks && topTracks.length > 0 && (
          <ArcCarousel
            items={topTracks.slice(0, 5).map((track, i) => ({
              id: track.id,
              content: (
                <div className="flex flex-col items-center gap-1">
                  <VinylCard
                    track={track}
                    isActive={activeTrackId === track.id}
                    onPlay={onTrackPlay}
                    size="sm"
                  />
                  <span className="text-[10px] font-bold text-black/40 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
              ),
            }))}
            radius={arcRadius}
            arcDeg={arcDeg}
            baseDelay={DELAY}
            title={carouselTitle}
            inverted
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **9.2 Commit**

```bash
git add src/components/artist/ArtistHeroSection.tsx
git commit -m "feat: add ArtistHeroSection with circular photo and arc SVG name"
```

---

## Task 10: ArtistBio + RelatedArtists

**Files:**
- Create: `src/components/artist/ArtistBio.tsx`
- Create: `src/components/artist/RelatedArtists.tsx`

- [ ] **10.1 Criar ArtistBio**

```tsx
// src/components/artist/ArtistBio.tsx
import { useArtistBio } from '@/hooks/queries/useArtistBio'
import { useTranslation } from 'react-i18next'

interface ArtistBioProps {
  artistName: string | undefined
}

export function ArtistBio({ artistName }: ArtistBioProps) {
  const { t } = useTranslation()
  const bio = useArtistBio(artistName)

  if (!bio.data) return null

  return (
    <section className="mb-8 px-2">
      <h3 className="text-sm font-bold text-black/50 mb-3">{t('artistDetail.bio')}</h3>
      <p className="text-sm text-black/70 leading-relaxed">{bio.data.extract}</p>
      <a
        href={bio.data.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-black/40 hover:text-black/70 underline mt-2 inline-block transition-colors"
      >
        Wikipedia →
      </a>
    </section>
  )
}
```

- [ ] **10.2 Criar RelatedArtists**

```tsx
// src/components/artist/RelatedArtists.tsx
import { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRelatedArtists } from '@/hooks/queries/useRelatedArtists'
import { ArtistCard } from '@/components/shared/ArtistCard'

const INITIAL_COUNT = 7
const PAGE_SIZE = 7

interface RelatedArtistsProps {
  artistId: string | undefined
}

export function RelatedArtists({ artistId }: RelatedArtistsProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const related = useRelatedArtists(artistId)
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const handleNavigate = useCallback((id: string) => {
    navigate(`/artists/${id}`, { state: { from: location.pathname } })
  }, [navigate, location.pathname])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !related.data) return

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setVisibleCount(c => Math.min(c + PAGE_SIZE, related.data!.length))
      }
    }, { threshold: 0.1 })

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [related.data])

  if (!related.data || related.data.length === 0) return null

  const visible = related.data.slice(0, visibleCount)

  return (
    <section className="mb-8">
      <h3 className="text-sm font-bold text-black/50 mb-3 px-2">{t('artistDetail.relatedArtists')}</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 px-2">
        {visible.map(artist => (
          <div key={artist.id} onClick={() => handleNavigate(artist.id)} className="cursor-pointer">
            <ArtistCard artist={artist} />
          </div>
        ))}
      </div>
      {visibleCount < (related.data.length) && (
        <div ref={sentinelRef} className="h-4 mt-2" />
      )}
    </section>
  )
}
```

> Nota: `ArtistCard` já tem `onClick` interno que chama `navigate`. Para passar `state.from`, precisamos sobrescrever. O `div` wrapper com `onClick` vai conflitar. Na Task 11 atualizamos `ArtistCard` para aceitar `onNavigate` prop opcional.

- [ ] **10.3 Commit**

```bash
git add src/components/artist/ArtistBio.tsx src/components/artist/RelatedArtists.tsx
git commit -m "feat: add ArtistBio and RelatedArtists components"
```

---

## Task 11: Router + navegação inteligente

**Files:**
- Modify: `src/router.tsx`
- Modify: `src/components/shared/ArtistCard.tsx`

- [ ] **11.1 Adicionar rotas no router.tsx**

```tsx
// src/router.tsx
import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { PlayerView } from '@/components/layout/PlayerView'
import { Login } from '@/pages/Login'
import { OAuthCallback } from '@/pages/OAuthCallback'
import { Home } from '@/pages/Home'
import { Artists } from '@/pages/Artists'
import { ArtistDetail } from '@/pages/ArtistDetail'
import { AlbumDetail } from '@/pages/AlbumDetail'
import { PlaylistDetail } from '@/pages/PlaylistDetail'
import { Favorites } from '@/pages/Favorites'
import { Profile } from '@/pages/Profile'

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/callback', element: <OAuthCallback /> },
  {
    path: '/player',
    element: (
      <ProtectedRoute>
        <PlayerView />
      </ProtectedRoute>
    ),
  },
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
      { path: 'albums/:id', element: <AlbumDetail /> },
      { path: 'playlists/:id', element: <PlaylistDetail /> },
      { path: 'favorites', element: <Favorites /> },
      { path: 'profile', element: <Profile /> },
    ],
  },
])
```

- [ ] **11.2 Atualizar ArtistCard para aceitar onNavigate opcional**

Em `src/components/shared/ArtistCard.tsx`, adicionar prop `onNavigate?: (id: string) => void`:

```tsx
// src/components/shared/ArtistCard.tsx
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { SpotifyArtist } from '@/types/spotify'

interface ArtistCardProps {
  artist: SpotifyArtist
  onNavigate?: (id: string) => void
}

export function ArtistCard({ artist, onNavigate }: ArtistCardProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const image = artist.images[0]?.url

  const handleClick = () => {
    if (onNavigate) onNavigate(artist.id)
    else navigate(`/artists/${artist.id}`)
  }

  return (
    <div
      className="cursor-pointer focus:outline-none group"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      aria-label={`Ver artista ${artist.name}`}
    >
      <div
        className={cn(
          'relative aspect-square overflow-hidden transition-all duration-200',
          'rounded-[14px] shadow-lg group-hover:shadow-xl',
          'ring-1 ring-white/10',
          'group-hover:scale-105 group-active:scale-95',
        )}
      >
        {image ? (
          <img
            src={image}
            alt={artist.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-black/20 flex items-center justify-center text-4xl text-white/20">
            ♪
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 px-2 pb-1.5">
          <p className="text-[9px] font-semibold text-white truncate leading-tight drop-shadow">
            {artist.name}
          </p>
          {artist.followers?.total != null && (
            <p className="text-[8px] text-white/60 truncate leading-tight">
              {artist.followers.total.toLocaleString()} {t('artists.followers')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **11.3 Atualizar RelatedArtists para usar onNavigate**

Em `src/components/artist/RelatedArtists.tsx`, substituir o `div` wrapper por passar `onNavigate` diretamente:

```tsx
{visible.map(artist => (
  <ArtistCard
    key={artist.id}
    artist={artist}
    onNavigate={handleNavigate}
  />
))}
```

Remover o `div onClick` wrapper.

- [ ] **11.4 Commit**

```bash
git add src/router.tsx src/components/shared/ArtistCard.tsx src/components/artist/RelatedArtists.tsx
git commit -m "feat: add album/playlist routes, update ArtistCard with onNavigate prop"
```

---

## Task 12: AlbumDetail page

**Files:**
- Create: `src/pages/AlbumDetail.tsx`

- [ ] **12.1 Criar AlbumDetail**

```tsx
// src/pages/AlbumDetail.tsx
import { useState, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAlbum } from '@/hooks/queries/useAlbum'
import { useAlbumTracks } from '@/hooks/queries/useAlbumTracks'
import { useAudioFeatures } from '@/hooks/queries/useAudioFeatures'
import { usePlayContext } from '@/hooks/usePlayContext'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { usePlayer } from '@/hooks/usePlayer'
import { averageAudioFeatures } from '@/utils/audioFeatures'
import { CollectionHeader } from '@/components/shared/CollectionHeader'
import { ListTableSwitch, type ViewMode } from '@/components/shared/ListTableSwitch'
import { TrackTable } from '@/components/shared/TrackTable'
import { TrackRow } from '@/components/shared/TrackRow'
import { MusicalProfileCharts } from '@/components/shared/MusicalProfileCharts'
import { Pagination } from '@/components/shared/Pagination'
import type { SpotifyAlbumSimple, SpotifyAlbumTrack, SpotifyTrack } from '@/types/spotify'

export function AlbumDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { state: playerState } = usePlayer()
  const playContext = usePlayContext()
  const playTrack = usePlayTrack()

  const [page, setPage] = useState(1)
  const [view, setView] = useState<ViewMode>('list')
  const [headerHeight, setHeaderHeight] = useState(320)

  const album = useAlbum(id)
  const tracks = useAlbumTracks(id, page, 20)

  const trackIds = tracks.data?.items.map(t => t.id) ?? []
  const audioFeatures = useAudioFeatures(trackIds)

  const avgFeatures = audioFeatures.data && audioFeatures.data.length > 0
    ? averageAudioFeatures(audioFeatures.data)
    : null

  const hasNext = tracks.data
    ? (tracks.data.offset + tracks.data.limit) < tracks.data.total
    : false

  const handleBack = useCallback(() => {
    const from = (location.state as { from?: string })?.from
    navigate(from ?? '/artists')
  }, [location.state, navigate])

  const handlePlay = useCallback(() => {
    if (album.data?.uri) playContext(album.data.uri)
  }, [album.data, playContext])

  const handleTrackPlay = useCallback((track: SpotifyTrack | SpotifyAlbumTrack) => {
    // Enriquecer AlbumTrack com dados do álbum para compatibilidade com usePlayTrack
    if (album.data && !('album' in track)) {
      const albumSimple: SpotifyAlbumSimple = {
        id: album.data.id,
        name: album.data.name,
        images: album.data.images,
        release_date: album.data.release_date,
        album_type: album.data.album_type,
        artists: album.data.artists,
        uri: album.data.uri,
        type: 'album',
        total_tracks: album.data.total_tracks,
      }
      playTrack({ ...track, album: albumSimple, type: 'track' as const } as SpotifyTrack)
    } else {
      playTrack(track as SpotifyTrack)
    }
  }, [album.data, playTrack])

  const artistName = album.data?.artists.map(a => a.name).join(', ')
  const year = album.data?.release_date?.slice(0, 4)

  return (
    <div className="min-h-screen">
      <CollectionHeader
        imageUrl={album.data?.images[0]?.url}
        name={album.data?.name ?? ''}
        subtitle={artistName ?? ''}
        year={year}
        playLabel={t('albumDetail.playAlbum')}
        onPlay={handlePlay}
        onBack={handleBack}
        onLayout={setHeaderHeight}
      />

      <div style={{ paddingTop: headerHeight }} className="px-4 pb-32">
        {/* Faixas */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-black/50">{t('albumDetail.tracks')}</h3>
            <ListTableSwitch view={view} onChange={setView} />
          </div>

          {view === 'list' && tracks.data?.items.map((track, i) => {
            const enriched: SpotifyTrack = {
              ...track,
              type: 'track',
              album: {
                id: album.data?.id ?? '',
                name: album.data?.name ?? '',
                images: album.data?.images ?? [],
                release_date: album.data?.release_date ?? '',
                album_type: album.data?.album_type ?? 'album',
                artists: album.data?.artists ?? [],
                uri: album.data?.uri ?? '',
                type: 'album',
              },
              popularity: 0,
            }
            return (
              <TrackRow
                key={track.id}
                track={enriched}
                index={(page - 1) * 20 + i}
                isActive={playerState.currentTrack?.id === track.id}
                onPlay={() => handleTrackPlay(track)}
              />
            )
          })}

          {view === 'table' && tracks.data?.items && (
            <TrackTable
              tracks={tracks.data.items}
              audioFeatures={audioFeatures.data}
              showAlbumColumn={false}
              activeTrackId={playerState.currentTrack?.id}
              onPlay={handleTrackPlay}
            />
          )}

          <Pagination
            page={page}
            hasNext={hasNext}
            onPrev={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => p + 1)}
            className="mt-4"
          />
        </div>

        {/* Perfil musical */}
        {avgFeatures && (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-black/50 mb-4 px-2">{t('albumDetail.musicalProfile')}</h3>
            <MusicalProfileCharts features={avgFeatures} theme="light" />
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **12.2 Commit**

```bash
git add src/pages/AlbumDetail.tsx
git commit -m "feat: add AlbumDetail page with track list/table and musical profile charts"
```

---

## Task 13: PlaylistDetail page

**Files:**
- Create: `src/pages/PlaylistDetail.tsx`

- [ ] **13.1 Criar PlaylistDetail**

```tsx
// src/pages/PlaylistDetail.tsx
import { useState, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePlaylist } from '@/hooks/queries/usePlaylist'
import { usePlaylistTracks } from '@/hooks/queries/usePlaylistTracks'
import { usePlayContext } from '@/hooks/usePlayContext'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { usePlayer } from '@/hooks/usePlayer'
import { CollectionHeader } from '@/components/shared/CollectionHeader'
import { ListTableSwitch, type ViewMode } from '@/components/shared/ListTableSwitch'
import { TrackTable } from '@/components/shared/TrackTable'
import { TrackRow } from '@/components/shared/TrackRow'
import { Pagination } from '@/components/shared/Pagination'
import type { SpotifyTrack } from '@/types/spotify'

export function PlaylistDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { state: playerState } = usePlayer()
  const playContext = usePlayContext()
  const playTrack = usePlayTrack()

  const [page, setPage] = useState(1)
  const [view, setView] = useState<ViewMode>('list')
  const [headerHeight, setHeaderHeight] = useState(320)

  const playlist = usePlaylist(id)
  const tracks = usePlaylistTracks(id ?? '', !!id, page, 20)

  const hasNext = tracks.data
    ? (tracks.data.offset + tracks.data.limit) < tracks.data.total
    : false

  const handleBack = useCallback(() => {
    const from = (location.state as { from?: string })?.from
    navigate(from ?? '/')
  }, [location.state, navigate])

  const handlePlay = useCallback(() => {
    if (playlist.data?.uri) playContext(playlist.data.uri)
  }, [playlist.data, playContext])

  const ownerName = playlist.data?.owner.display_name ?? ''

  return (
    <div className="min-h-screen">
      <CollectionHeader
        imageUrl={playlist.data?.images[0]?.url}
        name={playlist.data?.name ?? ''}
        subtitle={ownerName ? t('playlistDetail.owner', { name: ownerName }) : ''}
        playLabel={t('playlistDetail.playPlaylist')}
        onPlay={handlePlay}
        onBack={handleBack}
        onLayout={setHeaderHeight}
      />

      <div style={{ paddingTop: headerHeight }} className="px-4 pb-32">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-black/50">{t('playlistDetail.tracks')}</h3>
            <ListTableSwitch view={view} onChange={setView} />
          </div>

          {view === 'list' && tracks.data?.items.map((item, i) => {
            const track = item.item ?? item.track
            if (!track) return null
            return (
              <TrackRow
                key={`${track.id}-${i}`}
                track={track}
                index={(page - 1) * 20 + i}
                isActive={playerState.currentTrack?.id === track.id}
                onPlay={playTrack}
              />
            )
          })}

          {view === 'table' && tracks.data?.items && (
            <TrackTable
              tracks={tracks.data.items
                .map(item => item.item ?? item.track)
                .filter((t): t is SpotifyTrack => !!t)}
              activeTrackId={playerState.currentTrack?.id}
              onPlay={t => playTrack(t as SpotifyTrack)}
              onAlbumClick={albumId => navigate(`/albums/${albumId}`, { state: { from: location.pathname } })}
            />
          )}

          <Pagination
            page={page}
            hasNext={hasNext}
            onPrev={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => p + 1)}
            className="mt-4"
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **13.2 Commit**

```bash
git add src/pages/PlaylistDetail.tsx
git commit -m "feat: add PlaylistDetail page with track list/table"
```

---

## Task 14: Refatorar ArtistDetail

**Files:**
- Modify: `src/pages/ArtistDetail.tsx` (reescrita completa)

- [ ] **14.1 Reescrever ArtistDetail**

```tsx
// src/pages/ArtistDetail.tsx
import { useState, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useArtist } from '@/hooks/queries/useArtist'
import { useArtistTopTracks } from '@/hooks/queries/useArtistTopTracks'
import { useArtistAlbums } from '@/hooks/queries/useArtistAlbums'
import { useAudioFeatures } from '@/hooks/queries/useAudioFeatures'
import { usePlayContext } from '@/hooks/usePlayContext'
import { usePlayer } from '@/hooks/usePlayer'
import { averageAudioFeatures } from '@/utils/audioFeatures'
import { ArtistHeroSection } from '@/components/artist/ArtistHeroSection'
import { ArtistBio } from '@/components/artist/ArtistBio'
import { RelatedArtists } from '@/components/artist/RelatedArtists'
import { ListTableSwitch, type ViewMode } from '@/components/shared/ListTableSwitch'
import { AlbumTable } from '@/components/shared/AlbumTable'
import { TrackRow } from '@/components/shared/TrackRow'
import { MusicalProfileCharts } from '@/components/shared/MusicalProfileCharts'
import { Pagination } from '@/components/shared/Pagination'
import type { SpotifyTrack, SpotifyAlbumSimple } from '@/types/spotify'

export function ArtistDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { state: playerState } = usePlayer()
  const playContext = usePlayContext()

  const [albumPage, setAlbumPage] = useState(1)
  const [discView, setDiscView] = useState<ViewMode>('list')
  const [fixedZoneHeight, setFixedZoneHeight] = useState(400)

  const artist = useArtist(id)
  const topTracks = useArtistTopTracks(id)
  const albums = useArtistAlbums(id, albumPage, 10)

  const topTrackIds = topTracks.data?.map(t => t.id) ?? []
  const audioFeatures = useAudioFeatures(topTrackIds)
  const avgFeatures = audioFeatures.data && audioFeatures.data.length > 0
    ? averageAudioFeatures(audioFeatures.data)
    : null

  const hasNextAlbums = albums.data
    ? (albums.data.offset + albums.data.limit) < albums.data.total
    : false

  const handleBack = useCallback(() => {
    const from = (location.state as { from?: string })?.from
    navigate(from ?? '/artists')
  }, [location.state, navigate])

  const handleTrackPlay = useCallback((track: SpotifyTrack) => {
    // Toca as top tracks do artista como contexto (radio do artista)
    if (artist.data?.uri) playContext(artist.data.uri)
  }, [artist.data, playContext])

  const handleAlbumClick = useCallback((album: SpotifyAlbumSimple) => {
    navigate(`/albums/${album.id}`, { state: { from: location.pathname } })
  }, [navigate, location.pathname])

  return (
    <div className="min-h-screen">
      <ArtistHeroSection
        artist={artist.data}
        topTracks={topTracks.data}
        activeTrackId={playerState.currentTrack?.id}
        onTrackPlay={handleTrackPlay}
        onBack={handleBack}
        onLayout={setFixedZoneHeight}
        carouselTitle={t('artistDetail.topTracks')}
      />

      <div style={{ paddingTop: fixedZoneHeight }} className="px-4 pb-32">
        {/* Lista numerada das top 5 */}
        {topTracks.data && topTracks.data.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-black/50 mb-3 px-2">{t('artistDetail.topTracksRanked')}</h3>
            {topTracks.data.slice(0, 5).map((track, i) => (
              <div key={track.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 transition-colors cursor-pointer group" onClick={() => handleTrackPlay(track)}>
                <span className="w-5 text-xs font-black text-black/30 shrink-0 tabular-nums text-right">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <img
                  src={track.album.images[0]?.url}
                  alt=""
                  className="w-9 h-9 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-black truncate">{track.name}</p>
                  <p className="text-xs text-black/40 truncate">{track.album.name}</p>
                </div>
                <span className="text-xs text-black/30 shrink-0 tabular-nums">{track.popularity}</span>
              </div>
            ))}
          </div>
        )}

        {/* Discografia */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-sm font-bold text-black/50">{t('artistDetail.discography')}</h3>
            <ListTableSwitch view={discView} onChange={setDiscView} />
          </div>

          {discView === 'list' && albums.data?.items.map(album => (
            <div
              key={album.id}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
              onClick={() => handleAlbumClick(album)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && handleAlbumClick(album)}
            >
              <img
                src={album.images[0]?.url}
                alt={album.name}
                className="w-10 h-10 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-black truncate">{album.name}</p>
                <p className="text-xs text-black/40">{album.release_date?.slice(0, 4)}</p>
              </div>
              <span className="text-xs text-black/30 shrink-0 capitalize">{album.album_type}</span>
            </div>
          ))}

          {discView === 'table' && albums.data?.items && (
            <AlbumTable
              albums={albums.data.items}
              onClick={handleAlbumClick}
            />
          )}

          <Pagination
            page={albumPage}
            hasNext={hasNextAlbums}
            onPrev={() => setAlbumPage(p => Math.max(1, p - 1))}
            onNext={() => setAlbumPage(p => p + 1)}
            className="mt-4"
          />
        </div>

        {/* Bio do artista */}
        <ArtistBio artistName={artist.data?.name} />

        {/* Perfil musical */}
        {avgFeatures && (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-black/50 mb-4 px-2">{t('artistDetail.musicalProfile')}</h3>
            <MusicalProfileCharts features={avgFeatures} theme="light" />
          </div>
        )}

        {/* Artistas relacionados */}
        <RelatedArtists artistId={id} />
      </div>
    </div>
  )
}
```

- [ ] **14.2 Verificar que os testes existentes ainda passam**

```bash
npx vitest run
```

- [ ] **14.3 Commit**

```bash
git add src/pages/ArtistDetail.tsx
git commit -m "feat: refactor ArtistDetail with photo hero, numbered top tracks, discography table, bio and related artists"
```

---

## Task 15: TrackInfoPanel — seção Wikipedia

**Files:**
- Modify: `src/components/layout/TrackInfoPanel.tsx`

- [ ] **15.1 Adicionar useTrackWikipedia ao TrackInfoPanel**

Em `src/components/layout/TrackInfoPanel.tsx`:

1. Adicionar import:
```tsx
import { useTrackWikipedia } from '@/hooks/queries/useTrackWikipedia'
```

2. Dentro de `TrackInfoPanel`, após a declaração de `artist`:
```tsx
const wikipedia = useTrackWikipedia(track.name, track.artists[0]?.name)
```

3. Adicionar seção ao final do JSX (antes do fechamento do `div` principal, após o Mood quadrant):
```tsx
{/* Sobre a música */}
{wikipedia.data && (
  <Section label={t('track.aboutTrack')}>
    <div className="w-full max-w-sm">
      <p className="text-xs text-white/60 leading-relaxed">{wikipedia.data.extract}</p>
      <a
        href={wikipedia.data.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] text-white/35 hover:text-white/60 underline mt-2 inline-block transition-colors"
      >
        {t('track.readMore')} →
      </a>
    </div>
  </Section>
)}
```

- [ ] **15.2 Rodar todos os testes**

```bash
npx vitest run
```

Todos os testes devem passar.

- [ ] **15.3 Commit**

```bash
git add src/components/layout/TrackInfoPanel.tsx
git commit -m "feat: add Wikipedia section to TrackInfoPanel"
```

---

## Task 16: Verificação final e navegação a partir do Home/busca

**Files:**
- Verify: links de álbuns no Home e na busca precisam navegar para `/albums/:id` em vez de disparar `playContext`

- [ ] **16.1 Verificar Home.tsx para links de álbuns**

```bash
grep -n "playContext\|album.*uri\|album.*click" /home/jean/spotify-player/src/pages/Home.tsx
```

Se `Home` tiver cards de álbum clicáveis que chamam `playContext(album.uri)`, atualizar para `navigate('/albums/${album.id}', { state: { from: '/' } })`.

- [ ] **16.2 Verificar Artists.tsx para links de álbuns**

```bash
grep -n "playContext\|album.*click\|navigate.*album" /home/jean/spotify-player/src/pages/Artists.tsx
```

Ajustar links de álbuns na tela de busca da mesma forma.

- [ ] **16.3 Commit de ajustes de navegação (se necessário)**

```bash
git add src/pages/Home.tsx src/pages/Artists.tsx
git commit -m "fix: navigate to album/playlist pages instead of direct playContext on clicks"
```

---

## Checklist de auto-review do plano

- [x] **Spec coverage:** Todos os requisitos cobertos (ArtistHeroSection, ArcCarousel mantido, numeração 01-05, listagem/tabela nas 3 páginas, bio Wikipedia, charts radar+bars, RelatedArtists com IntersectionObserver, CollectionHeader, navegação smart, TrackInfoPanel Wikipedia)
- [x] **Sem placeholders:** Código completo em cada step
- [x] **Consistência de tipos:** `SpotifyAlbumTrack` definido na Task 1 e usado em Task 6 e 12; `averageAudioFeatures` definido na Task 1 e usado nas Tasks 12 e 14; `ViewMode` exportado de `ListTableSwitch` e importado nas páginas
- [x] **`usePlaylistTracks` quebra:** Documentado na Task 2, step 2.5 e 2.6
- [x] **`RelatedArtists`/`ArtistCard` conflito:** Resolvido na Task 11 com prop `onNavigate`
