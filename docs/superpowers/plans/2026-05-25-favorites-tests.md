# Favorites Test Coverage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add unit tests for all untested favorites components/hooks and expand E2E to cover the full add/remove flow.

**Architecture:** Unit tests use Vitest + Testing Library with heavy `vi.mock()` isolation — hooks are mocked, components render against fake data. E2E uses Playwright with `page.route()` mocks extended to cover track search and playlist item mutations.

**Tech Stack:** Vitest, @testing-library/react, userEvent, Playwright, MSW (for Home.test.tsx pattern only — not used in new unit tests)

---

## File Map

**Create:**
- `src/hooks/__tests__/useFavoriteStorage.test.ts`
- `src/hooks/__tests__/useIsTrackFavorite.test.ts`
- `src/components/favorites/__tests__/AddFavoriteForm.test.tsx`
- `src/components/favorites/__tests__/TrackAutocomplete.test.tsx`
- `src/components/layout/mini-player/__tests__/FavoriteButton.test.tsx`
- `src/pages/__tests__/Favorites.test.tsx`

**Modify:**
- `src/hooks/__tests__/useSpoterPlaylist.test.ts` — add lazy creation scenarios
- `tests-e2e/fixtures/auth.ts` — add track search + playlist items POST mock
- `tests-e2e/favorites.spec.ts` — add full add/remove/empty/heart flows

---

### Task 1: useFavoriteStorage — unit tests

**Files:**
- Create: `src/hooks/__tests__/useFavoriteStorage.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFavoriteStorage } from '@/hooks/useFavoriteStorage'
import type { SpotifyTrack } from '@/types/spotify'

vi.mock('@/utils/favCookie', () => ({
  readFavCookie: vi.fn(() => []),
  writeFavCookie: vi.fn(),
}))
vi.mock('@/utils/favHydration', () => ({
  hydrateFromApi: vi.fn().mockResolvedValue([]),
}))

const mockTrack = (id: string): SpotifyTrack => ({
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
})

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('useFavoriteStorage', () => {
  it('inicia com lista vazia quando localStorage está limpo', () => {
    const { result } = renderHook(() => useFavoriteStorage('u1'))
    expect(result.current.tracks).toHaveLength(0)
  })

  it('inicia com tracks existentes no localStorage', () => {
    localStorage.setItem('spoter_favorites_u1', JSON.stringify([mockTrack('t1')]))
    const { result } = renderHook(() => useFavoriteStorage('u1'))
    expect(result.current.tracks).toHaveLength(1)
    expect(result.current.tracks[0].id).toBe('t1')
  })

  it('addTrack adiciona track e retorna true', () => {
    const { result } = renderHook(() => useFavoriteStorage('u1'))
    let added: boolean | undefined
    act(() => {
      added = result.current.addTrack(mockTrack('t2'))
    })
    expect(added).toBe(true)
    expect(result.current.tracks).toHaveLength(1)
    expect(result.current.tracks[0].id).toBe('t2')
  })

  it('addTrack ignora duplicata e retorna false', () => {
    const { result } = renderHook(() => useFavoriteStorage('u1'))
    act(() => {
      result.current.addTrack(mockTrack('t3'))
    })
    let added: boolean | undefined
    act(() => {
      added = result.current.addTrack(mockTrack('t3'))
    })
    expect(added).toBe(false)
    expect(result.current.tracks).toHaveLength(1)
  })

  it('addTrack com nota persiste a nota', () => {
    const { result } = renderHook(() => useFavoriteStorage('u1'))
    act(() => {
      result.current.addTrack(mockTrack('t4'), 'ouço no treino')
    })
    expect(result.current.notes['spotify:track:t4']).toBe('ouço no treino')
  })

  it('removeTrack remove por uri e retorna true', () => {
    const { result } = renderHook(() => useFavoriteStorage('u1'))
    act(() => {
      result.current.addTrack(mockTrack('t5'))
    })
    let removed: boolean | undefined
    act(() => {
      removed = result.current.removeTrack('spotify:track:t5')
    })
    expect(removed).toBe(true)
    expect(result.current.tracks).toHaveLength(0)
  })

  it('removeTrack remove a nota associada', () => {
    const { result } = renderHook(() => useFavoriteStorage('u1'))
    act(() => {
      result.current.addTrack(mockTrack('t6'), 'nota importante')
    })
    act(() => {
      result.current.removeTrack('spotify:track:t6')
    })
    expect(result.current.notes['spotify:track:t6']).toBeUndefined()
  })

  it('replaceTracks substitui toda a lista', () => {
    const { result } = renderHook(() => useFavoriteStorage('u1'))
    act(() => {
      result.current.addTrack(mockTrack('old1'))
      result.current.addTrack(mockTrack('old2'))
    })
    act(() => {
      result.current.replaceTracks([mockTrack('new1')])
    })
    expect(result.current.tracks).toHaveLength(1)
    expect(result.current.tracks[0].id).toBe('new1')
  })

  it('reage ao evento spoter:favorites-changed disparado externamente', () => {
    localStorage.setItem('spoter_favorites_u1', JSON.stringify([mockTrack('ext1')]))
    const { result } = renderHook(() => useFavoriteStorage('u1'))
    expect(result.current.tracks).toHaveLength(1)

    act(() => {
      localStorage.setItem('spoter_favorites_u1', JSON.stringify([mockTrack('ext1'), mockTrack('ext2')]))
      window.dispatchEvent(new CustomEvent('spoter:favorites-changed'))
    })
    expect(result.current.tracks).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run tests**

```bash
yarn test src/hooks/__tests__/useFavoriteStorage.test.ts
```

Expected: all 9 pass.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/__tests__/useFavoriteStorage.test.ts
git commit -m "test: unit tests for useFavoriteStorage"
```

---

### Task 2: useIsTrackFavorite — unit tests

**Files:**
- Create: `src/hooks/__tests__/useIsTrackFavorite.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
import { describe, it, expect, beforeEach, act } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIsTrackFavorite } from '@/hooks/useIsTrackFavorite'
import { writeLocalTracks } from '@/utils/favStorage'
import type { SpotifyTrack } from '@/types/spotify'

const mockTrack = (id: string): SpotifyTrack => ({
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
    images: [],
    release_date: '2024-01-01',
    album_type: 'album',
    artists: [],
    uri: 'spotify:album:alb1',
    type: 'album',
  },
})

beforeEach(() => {
  localStorage.clear()
})

describe('useIsTrackFavorite', () => {
  it('retorna false quando uri é null', () => {
    const { result } = renderHook(() => useIsTrackFavorite(null, 'u1'))
    expect(result.current).toBe(false)
  })

  it('retorna false quando userId é vazio', () => {
    const { result } = renderHook(() => useIsTrackFavorite('spotify:track:t1', ''))
    expect(result.current).toBe(false)
  })

  it('retorna false quando track não está no localStorage', () => {
    const { result } = renderHook(() => useIsTrackFavorite('spotify:track:t1', 'u1'))
    expect(result.current).toBe(false)
  })

  it('retorna true quando track existe no localStorage', () => {
    writeLocalTracks('u1', [mockTrack('t1')])
    const { result } = renderHook(() => useIsTrackFavorite('spotify:track:t1', 'u1'))
    expect(result.current).toBe(true)
  })

  it('atualiza reativamente ao evento spoter:favorites-changed', () => {
    const { result } = renderHook(() => useIsTrackFavorite('spotify:track:t2', 'u1'))
    expect(result.current).toBe(false)

    act(() => {
      writeLocalTracks('u1', [mockTrack('t2')])
    })

    expect(result.current).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests**

```bash
yarn test src/hooks/__tests__/useIsTrackFavorite.test.ts
```

Expected: all 5 pass.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/__tests__/useIsTrackFavorite.test.ts
git commit -m "test: unit tests for useIsTrackFavorite"
```

---

### Task 3: AddFavoriteForm — unit tests

**Files:**
- Create: `src/components/favorites/__tests__/AddFavoriteForm.test.tsx`

- [ ] **Step 1: Create the test file**

`TrackAutocomplete` is stubbed to avoid its search dependencies. The form logic (Zod + react-hook-form) runs real.

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SpotifyTrack } from '@/types/spotify'

const mockTrack: SpotifyTrack = {
  id: 't1',
  uri: 'spotify:track:t1',
  name: 'Test Track',
  duration_ms: 180000,
  explicit: false,
  popularity: 80,
  preview_url: null,
  type: 'track',
  artists: [{ id: 'a1', name: 'Test Artist', uri: 'spotify:artist:a1', type: 'artist' }],
  album: {
    id: 'alb1',
    name: 'Test Album',
    images: [{ url: 'https://img.test/1.jpg', width: 300, height: 300 }],
    release_date: '2024-01-01',
    album_type: 'album',
    artists: [],
    uri: 'spotify:album:alb1',
    type: 'album',
  },
}

// Stub TrackAutocomplete: renders a button that, when clicked, calls onChange(mockTrack)
vi.mock('@/components/favorites/TrackAutocomplete', () => ({
  TrackAutocomplete: ({
    onChange,
    value,
  }: {
    onChange: (t: SpotifyTrack | null) => void
    value: SpotifyTrack | null
    onBlur: () => void
    error?: string
  }) =>
    value ? (
      <div data-testid="selected-track">{value.name}</div>
    ) : (
      <button type="button" onClick={() => { onChange(mockTrack) }}>
        Selecionar música
      </button>
    ),
}))

import { AddFavoriteForm } from '@/components/favorites/AddFavoriteForm'

const onAdd = vi.fn()
const onClose = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

function renderForm(existingFavorites: SpotifyTrack[] = []) {
  return render(
    <AddFavoriteForm
      existingFavorites={existingFavorites}
      onAdd={onAdd}
      onClose={onClose}
    />
  )
}

describe('AddFavoriteForm', () => {
  it('botão de submit está desabilitado sem track selecionada', () => {
    renderForm()
    expect(screen.getByRole('button', { name: /favorites\.addConfirm/i })).toBeDisabled()
  })

  it('selecionar track habilita o botão de submit', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /selecionar música/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /favorites\.addConfirm/i })).not.toBeDisabled()
    })
  })

  it('exibe aviso quando track já está nos favoritos', async () => {
    const user = userEvent.setup()
    renderForm([mockTrack])
    await user.click(screen.getByRole('button', { name: /selecionar música/i }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('submit desabilitado quando track já é favorita', async () => {
    const user = userEvent.setup()
    renderForm([mockTrack])
    await user.click(screen.getByRole('button', { name: /selecionar música/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /favorites\.addConfirm/i })).toBeDisabled()
    })
  })

  it('submit chama onAdd e onClose com track e nota', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /selecionar música/i }))
    await user.type(screen.getByRole('textbox'), 'ouço no treino')
    await user.click(screen.getByRole('button', { name: /favorites\.addConfirm/i }))
    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith(mockTrack, 'ouço no treino')
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('submit com nota vazia chama onAdd com undefined como nota', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /selecionar música/i }))
    await user.click(screen.getByRole('button', { name: /favorites\.addConfirm/i }))
    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith(mockTrack, undefined)
    })
  })

  it('contador de nota reflete o número de caracteres digitados', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /selecionar música/i }))
    await user.type(screen.getByRole('textbox'), 'abc')
    expect(screen.getByText(/3\/80/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests**

```bash
yarn test src/components/favorites/__tests__/AddFavoriteForm.test.tsx
```

Expected: all 7 pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/favorites/__tests__/AddFavoriteForm.test.tsx
git commit -m "test: unit tests for AddFavoriteForm"
```

---

### Task 4: TrackAutocomplete — unit tests

**Files:**
- Create: `src/components/favorites/__tests__/TrackAutocomplete.test.tsx`

- [ ] **Step 1: Create the test file**

`useDebounce` is mocked to pass-through (no delay). `useSearchTracks` returns controlled results.

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SpotifyTrack } from '@/types/spotify'

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: unknown) => value,
}))

const mockSearchResults: SpotifyTrack[] = [
  {
    id: 'r1',
    uri: 'spotify:track:r1',
    name: 'Resultado Um',
    duration_ms: 200000,
    explicit: false,
    popularity: 70,
    preview_url: null,
    type: 'track',
    artists: [{ id: 'a1', name: 'Artista A', uri: 'spotify:artist:a1', type: 'artist' }],
    album: {
      id: 'alb1',
      name: 'Álbum A',
      images: [{ url: 'https://img.test/1.jpg', width: 64, height: 64 }],
      release_date: '2024-01-01',
      album_type: 'album',
      artists: [],
      uri: 'spotify:album:alb1',
      type: 'album',
    },
  },
]

const mockUseSearchTracks = vi.fn()
vi.mock('@/hooks/queries/useSearchTracks', () => ({
  useSearchTracks: (query: string, enabled: boolean) => mockUseSearchTracks(query, enabled),
}))

import { TrackAutocomplete } from '@/components/favorites/TrackAutocomplete'

const onChange = vi.fn()
const onBlur = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockUseSearchTracks.mockReturnValue({ data: [], isPending: false })
})

describe('TrackAutocomplete', () => {
  it('renderiza o combobox com placeholder correto', () => {
    render(<TrackAutocomplete value={null} onChange={onChange} onBlur={onBlur} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('não busca quando query tem menos de 2 caracteres', async () => {
    const user = userEvent.setup()
    render(<TrackAutocomplete value={null} onChange={onChange} onBlur={onBlur} />)
    await user.type(screen.getByRole('combobox'), 'a')
    expect(mockUseSearchTracks).toHaveBeenCalledWith('a', false)
  })

  it('busca quando query tem 2+ caracteres', async () => {
    const user = userEvent.setup()
    render(<TrackAutocomplete value={null} onChange={onChange} onBlur={onBlur} />)
    await user.type(screen.getByRole('combobox'), 'Mo')
    expect(mockUseSearchTracks).toHaveBeenCalledWith('Mo', true)
  })

  it('mostra resultados quando a busca retorna dados', async () => {
    mockUseSearchTracks.mockReturnValue({ data: mockSearchResults, isPending: false })
    const user = userEvent.setup()
    render(<TrackAutocomplete value={null} onChange={onChange} onBlur={onBlur} />)
    await user.type(screen.getByRole('combobox'), 'Re')
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
      expect(screen.getByText('Resultado Um')).toBeInTheDocument()
    })
  })

  it('clicar em um resultado chama onChange com a track', async () => {
    mockUseSearchTracks.mockReturnValue({ data: mockSearchResults, isPending: false })
    const user = userEvent.setup()
    render(<TrackAutocomplete value={null} onChange={onChange} onBlur={onBlur} />)
    await user.type(screen.getByRole('combobox'), 'Re')
    await waitFor(() => screen.getByText('Resultado Um'))
    await user.click(screen.getByText('Resultado Um'))
    expect(onChange).toHaveBeenCalledWith(mockSearchResults[0])
  })

  it('quando value está definido, renderiza SelectedTrack em vez do input', () => {
    render(
      <TrackAutocomplete value={mockSearchResults[0]} onChange={onChange} onBlur={onBlur} />
    )
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.getByText('Resultado Um')).toBeInTheDocument()
  })

  it('botão de limpar chama onChange(null)', async () => {
    const user = userEvent.setup()
    render(
      <TrackAutocomplete value={mockSearchResults[0]} onChange={onChange} onBlur={onBlur} />
    )
    await user.click(screen.getByRole('button', { name: /favorites\.clearTrack/i }))
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
```

- [ ] **Step 2: Run tests**

```bash
yarn test src/components/favorites/__tests__/TrackAutocomplete.test.tsx
```

Expected: all 7 pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/favorites/__tests__/TrackAutocomplete.test.tsx
git commit -m "test: unit tests for TrackAutocomplete"
```

---

### Task 5: FavoriteButton — unit tests

**Files:**
- Create: `src/components/layout/mini-player/__tests__/FavoriteButton.test.tsx`

- [ ] **Step 1: Create the test file**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SpotifyTrack } from '@/types/spotify'

const mockTrack: SpotifyTrack = {
  id: 't1',
  uri: 'spotify:track:t1',
  name: 'Test Track',
  duration_ms: 180000,
  explicit: false,
  popularity: 80,
  preview_url: null,
  type: 'track',
  artists: [{ id: 'a1', name: 'Test Artist', uri: 'spotify:artist:a1', type: 'artist' }],
  album: {
    id: 'alb1',
    name: 'Test Album',
    images: [],
    release_date: '2024-01-01',
    album_type: 'album',
    artists: [],
    uri: 'spotify:album:alb1',
    type: 'album',
  },
}

const mockToast = vi.fn()
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

const mockDispatch = vi.fn()
const mockPlayerState = { currentTrack: mockTrack, isPlaying: false }
vi.mock('@/hooks/usePlayer', () => ({
  usePlayer: () => ({ state: mockPlayerState, dispatch: mockDispatch }),
}))

import { FavoriteButton } from '@/components/layout/mini-player/FavoriteButton'

const addTrack = vi.fn()
const removeTrack = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockPlayerState.currentTrack = mockTrack
})

describe('FavoriteButton', () => {
  it('retorna null quando não há currentTrack', () => {
    mockPlayerState.currentTrack = null as unknown as SpotifyTrack
    const { container } = render(
      <FavoriteButton isSaved={false} addTrack={addTrack} removeTrack={removeTrack} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renderiza o botão de coração quando há currentTrack', () => {
    render(<FavoriteButton isSaved={false} addTrack={addTrack} removeTrack={removeTrack} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('aria-label indica "adicionar" quando isSaved=false', () => {
    render(<FavoriteButton isSaved={false} addTrack={addTrack} removeTrack={removeTrack} />)
    expect(screen.getByRole('button', { name: /favorites\.addToList/i })).toBeInTheDocument()
  })

  it('aria-label indica "remover" quando isSaved=true', () => {
    render(<FavoriteButton isSaved={true} addTrack={addTrack} removeTrack={removeTrack} />)
    expect(screen.getByRole('button', { name: /favorites\.removeFromList/i })).toBeInTheDocument()
  })

  it('click quando não salvo chama addTrack com a track atual', async () => {
    const user = userEvent.setup()
    render(<FavoriteButton isSaved={false} addTrack={addTrack} removeTrack={removeTrack} />)
    await user.click(screen.getByRole('button'))
    expect(addTrack).toHaveBeenCalledWith(mockTrack)
    expect(removeTrack).not.toHaveBeenCalled()
  })

  it('click quando salvo chama removeTrack com o uri da track', async () => {
    const user = userEvent.setup()
    render(<FavoriteButton isSaved={true} addTrack={addTrack} removeTrack={removeTrack} />)
    await user.click(screen.getByRole('button'))
    expect(removeTrack).toHaveBeenCalledWith('spotify:track:t1')
    expect(addTrack).not.toHaveBeenCalled()
  })

  it('dispara toast ao adicionar', async () => {
    const user = userEvent.setup()
    render(<FavoriteButton isSaved={false} addTrack={addTrack} removeTrack={removeTrack} />)
    await user.click(screen.getByRole('button'))
    expect(mockToast).toHaveBeenCalled()
  })

  it('dispara toast ao remover', async () => {
    const user = userEvent.setup()
    render(<FavoriteButton isSaved={true} addTrack={addTrack} removeTrack={removeTrack} />)
    await user.click(screen.getByRole('button'))
    expect(mockToast).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests**

```bash
yarn test src/components/layout/mini-player/__tests__/FavoriteButton.test.tsx
```

Expected: all 8 pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/mini-player/__tests__/FavoriteButton.test.tsx
git commit -m "test: unit tests for FavoriteButton"
```

---

### Task 6: Favorites page — unit tests

**Files:**
- Create: `src/pages/__tests__/Favorites.test.tsx`

- [ ] **Step 1: Create the test file**

Mock `useSpoterPlaylist` and `usePlayer`. No providers needed since all hooks are mocked.

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { SpotifyTrack } from '@/types/spotify'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement('div', props, children),
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) =>
      React.createElement('span', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/hooks/usePlayer', () => ({
  usePlayer: () => ({
    state: { currentTrack: null, isPlaying: false },
    dispatch: vi.fn(),
  }),
}))

vi.mock('@/hooks/usePlayTrack', () => ({
  usePlayTrack: () => vi.fn(),
}))

vi.mock('@/hooks/usePopoverDismiss', () => ({
  usePopoverDismiss: vi.fn(),
}))

const mockSpoterPlaylist = {
  tracks: [] as SpotifyTrack[],
  notes: {} as Record<string, string>,
  addTrack: vi.fn(),
  removeTrack: vi.fn(),
  refresh: vi.fn(),
  isRefreshing: false,
  isLoading: false,
  playlistId: 'pl-1',
  playlistName: "User's Spoter List",
}

vi.mock('@/hooks/useSpoterPlaylist', () => ({
  useSpoterPlaylist: () => mockSpoterPlaylist,
}))

import React from 'react'
import { Favorites } from '@/pages/Favorites'

const mockTrack = (id: string): SpotifyTrack => ({
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
    images: [],
    release_date: '2024-01-01',
    album_type: 'album',
    artists: [],
    uri: 'spotify:album:alb1',
    type: 'album',
  },
})

function renderFavorites() {
  return render(
    <MemoryRouter>
      <Favorites />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSpoterPlaylist.tracks = []
  mockSpoterPlaylist.isLoading = false
})

describe('Favorites', () => {
  it('mostra EmptyState quando tracks está vazio', () => {
    renderFavorites()
    expect(screen.getByText('favorites.emptyList')).toBeInTheDocument()
  })

  it('não mostra EmptyState quando há tracks', () => {
    mockSpoterPlaylist.tracks = [mockTrack('t1')]
    renderFavorites()
    expect(screen.queryByText('favorites.emptyList')).toBeNull()
  })

  it('renderiza uma linha por track', () => {
    mockSpoterPlaylist.tracks = [mockTrack('t1'), mockTrack('t2')]
    renderFavorites()
    expect(screen.getByText('Track t1')).toBeInTheDocument()
    expect(screen.getByText('Track t2')).toBeInTheDocument()
  })

  it('mostra skeleton quando isLoading é true', () => {
    mockSpoterPlaylist.isLoading = true
    renderFavorites()
    // TrackRowSkeleton renders divs with animate-pulse
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('botão de adicionar abre o popover (aria-expanded)', async () => {
    const user = userEvent.setup()
    renderFavorites()
    const addBtn = screen.getByRole('button', { name: /favorites\.addButton/i })
    expect(addBtn).toHaveAttribute('aria-expanded', 'false')
    await user.click(addBtn)
    expect(addBtn).toHaveAttribute('aria-expanded', 'true')
  })

  it('clicar no botão aberto fecha o popover', async () => {
    const user = userEvent.setup()
    renderFavorites()
    const addBtn = screen.getByRole('button', { name: /favorites\.addButton/i })
    await user.click(addBtn)
    // After open, button label changes to 'close'
    const closeBtn = screen.getByRole('button', { name: /favorites\.close/i })
    await user.click(closeBtn)
    expect(screen.getByRole('button', { name: /favorites\.addButton/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })
})
```

- [ ] **Step 2: Run tests**

```bash
yarn test src/pages/__tests__/Favorites.test.tsx
```

Expected: all 6 pass.

- [ ] **Step 3: Commit**

```bash
git add src/pages/__tests__/Favorites.test.tsx
git commit -m "test: unit tests for Favorites page"
```

---

### Task 7: useSpoterPlaylist — add lazy creation tests

**Files:**
- Modify: `src/hooks/__tests__/useSpoterPlaylist.test.ts`

- [ ] **Step 1: Refactor top-level mocks to use vi.fn() for overrideable hooks, add new describe block**

Replace the existing content of `src/hooks/__tests__/useSpoterPlaylist.test.ts` with:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mocks must be declared before imports (Vitest hoisting)
vi.mock('@/hooks/queries/useUserPlaylists', () => ({
  useUserPlaylists: vi.fn(() => ({
    isSuccess: true,
    data: { items: [{ id: 'pl-123', name: "User's Spoter List", owner: { id: 'user-1' } }] },
  })),
}))
vi.mock('@/hooks/queries/usePlaylistTracks', () => ({
  usePlaylistTracks: () => ({ isSuccess: false, data: null }),
}))

const mockCreateMutate = vi.fn()
vi.mock('@/hooks/mutations/useCreatePlaylist', () => ({
  useCreatePlaylist: () => ({ mutate: mockCreateMutate }),
}))
vi.mock('@/hooks/mutations/useUpdatePlaylist', () => ({
  useUpdatePlaylist: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/mutations/useUploadPlaylistCover', () => ({
  useUploadPlaylistCover: () => ({ mutate: vi.fn() }),
}))

const mockAddMutate = vi.fn()
vi.mock('@/hooks/mutations/useAddToPlaylist', () => ({
  useAddToPlaylist: () => ({ mutate: mockAddMutate }),
}))
vi.mock('@/hooks/mutations/useRemoveFromPlaylist', () => ({
  useRemoveFromPlaylist: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))
vi.mock('@/lib/axios', () => ({
  default: { get: vi.fn() },
}))
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ state: { profile: { id: 'user-1', display_name: 'User' } } }),
}))
vi.mock('@/utils/favHydration', () => ({
  hydrateFromApi: vi.fn().mockResolvedValue([]),
}))

import { renderHook, act } from '@testing-library/react'
import { useSpoterPlaylist } from '@/hooks/useSpoterPlaylist'
import { useUserPlaylists } from '@/hooks/queries/useUserPlaylists'
import { writeLocalTracks } from '@/utils/favStorage'
import type { SpotifyTrack } from '@/types/spotify'

const mockTrack = (id: string): SpotifyTrack => ({
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
})

beforeEach(() => {
  localStorage.clear()
  document.cookie.split(';').forEach((c) => {
    document.cookie = c.replace(/=.*/, '=;max-age=0;path=/')
  })
  vi.clearAllMocks()
  // Restore default mock: playlist found by name
  vi.mocked(useUserPlaylists).mockReturnValue({
    isSuccess: true,
    data: { items: [{ id: 'pl-123', name: "User's Spoter List", owner: { id: 'user-1' } }] },
  } as ReturnType<typeof useUserPlaylists>)
})

describe('useSpoterPlaylist — encontra playlist existente', () => {
  it('encontra a playlist existente pelo nome e dono', () => {
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
    act(() => {
      result.current.addTrack(mockTrack('t2'))
    })
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
    act(() => {
      result.current.addTrack(mockTrack('t4'))
    })
    act(() => {
      result.current.removeTrack('spotify:track:t4')
    })
    expect(result.current.tracks).toHaveLength(0)
  })
})

describe('useSpoterPlaylist — criação lazy (sem playlist existente)', () => {
  beforeEach(() => {
    // No matching playlist in the user's library
    vi.mocked(useUserPlaylists).mockReturnValue({
      isSuccess: true,
      data: { items: [] },
    } as ReturnType<typeof useUserPlaylists>)
  })

  it('não há playlistId quando nenhuma playlist é encontrada', () => {
    const { result } = renderHook(() => useSpoterPlaylist())
    expect(result.current.playlistId).toBe('')
  })

  it('addTrack sem playlistId chama createPlaylist.mutate', () => {
    const { result } = renderHook(() => useSpoterPlaylist())
    act(() => {
      result.current.addTrack(mockTrack('new1'))
    })
    expect(mockCreateMutate).toHaveBeenCalledWith(
      { userId: 'user-1', name: expect.stringContaining('Spoter') },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    )
  })

  it('addTrack adiciona a track localmente mesmo antes da criação completar', () => {
    const { result } = renderHook(() => useSpoterPlaylist())
    act(() => {
      result.current.addTrack(mockTrack('new2'))
    })
    expect(result.current.tracks).toHaveLength(1)
    expect(result.current.tracks[0].id).toBe('new2')
  })

  it('após playlistId existente, addTrack usa addMutation sem criar de novo', () => {
    // Simulate a stored playlist ID
    localStorage.setItem('spoter_playlist_user-1', 'existing-pl')
    const { result } = renderHook(() => useSpoterPlaylist())
    act(() => {
      result.current.addTrack(mockTrack('t5'))
    })
    expect(mockCreateMutate).not.toHaveBeenCalled()
    expect(mockAddMutate).toHaveBeenCalledWith({ playlistId: 'existing-pl', uris: ['spotify:track:t5'] })
  })
})
```

- [ ] **Step 2: Run tests**

```bash
yarn test src/hooks/__tests__/useSpoterPlaylist.test.ts
```

Expected: all 9 pass (5 existing + 4 new).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/__tests__/useSpoterPlaylist.test.ts
git commit -m "test: expand useSpoterPlaylist with lazy creation scenarios"
```

---

### Task 8: E2E fixture — track search + playlist items POST

**Files:**
- Modify: `tests-e2e/fixtures/auth.ts`

- [ ] **Step 1: Add track search handling inside the existing `search` route handler**

In `setupApiRoutes`, locate the `**/api.spotify.com/v1/search**` route handler. Add a `type=track` branch **before** the default artist fallback:

```typescript
// Inside the search route handler, before the final artist default:
if (type.includes('track')) {
  const filteredTracks = mockTracks.filter((t) =>
    t.name.toLowerCase().includes(q.toLowerCase())
  )
  const slice = filteredTracks.slice(offset, offset + limit)
  return route.fulfill({
    json: {
      tracks: {
        items: slice,
        total: filteredTracks.length,
        limit,
        offset,
        next: null,
        previous: null,
        href: '',
      },
    },
  })
}
```

- [ ] **Step 2: Add playlist items POST mock**

In `setupApiRoutes`, locate the `**/api.spotify.com/v1/playlists/*/items**` route. It currently only handles GET. Change it to also handle POST:

```typescript
await page.route('**/api.spotify.com/v1/playlists/*/items**', async (route) => {
  if (route.request().method() === 'POST') {
    await route.fulfill({ status: 201, json: { snapshot_id: 'snap-after-add' } })
  } else {
    await route.fulfill({
      json: {
        items: [],
        limit: 50,
        offset: 0,
        total: 0,
        next: null,
        previous: null,
        href: '',
      },
    })
  }
})
```

- [ ] **Step 3: Run existing E2E to confirm no regressions**

```bash
yarn test:e2e tests-e2e/favorites.spec.ts
```

Expected: all 5 existing pass.

- [ ] **Step 4: Commit**

```bash
git add tests-e2e/fixtures/auth.ts
git commit -m "test(e2e): extend fixture with track search and playlist items POST mock"
```

---

### Task 9: E2E favorites — full flow scenarios

**Files:**
- Modify: `tests-e2e/favorites.spec.ts`

- [ ] **Step 1: Add the new scenarios to the existing file**

Append to the existing `favorites.spec.ts` (keep all 5 existing tests, add new `describe` blocks):

```typescript
import { test, expect } from './fixtures/auth'
import { mockTracks } from './fixtures/mock-data'

// --- existing 5 tests stay unchanged above ---

test.describe('Favorites — empty state', () => {
  test('exibe mensagem de lista vazia quando não há favoritos', async ({ page }) => {
    await page.goto('/favorites')
    await expect(
      page.getByText(/nenhum favorito ainda|no favorites yet/i)
    ).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Favorites — fluxo completo de adicionar', () => {
  test('adicionar uma música via formulário faz ela aparecer na lista', async ({ page }) => {
    await page.goto('/favorites')

    // Open add popover
    await page.getByRole('button', { name: /adicionar favorito|add favorite/i }).click()

    // Type in autocomplete — mock returns mockTracks filtered by "Track"
    const combobox = page.getByRole('combobox')
    await combobox.fill('Track')

    // Wait for the first result to appear and click it
    const firstResult = page.getByRole('listbox').getByRole('option').first()
    await firstResult.waitFor({ timeout: 5000 })
    await firstResult.click()

    // Submit
    await page
      .getByRole('button', { name: /adicionar ao favorito|add to favorites/i })
      .click()

    // The track name should appear in the favorites list
    await expect(page.getByText(mockTracks[0].name)).toBeVisible({ timeout: 5000 })
  })

  test('adicionar com nota salva a nota na lista', async ({ page }) => {
    await page.goto('/favorites')
    await page.getByRole('button', { name: /adicionar favorito|add favorite/i }).click()

    const combobox = page.getByRole('combobox')
    await combobox.fill('Track')
    await page.getByRole('listbox').getByRole('option').first().waitFor({ timeout: 5000 })
    await page.getByRole('listbox').getByRole('option').first().click()

    await page.getByRole('textbox').fill('ouço no treino')
    await page.getByRole('button', { name: /adicionar ao favorito|add to favorites/i }).click()

    await expect(page.getByText('ouço no treino')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Favorites — remover track', () => {
  test('remover track da lista faz ela desaparecer', async ({ page }) => {
    // Pre-populate localStorage with one track so the list is not empty
    const track = mockTracks[0]
    await page.addInitScript(
      ({ trackJson, userId }) => {
        const storageKey = `spoter_favorites_${userId}`
        localStorage.setItem(storageKey, JSON.stringify([trackJson]))
        // Also set playlist id to avoid creation flow
        localStorage.setItem(`spoter_playlist_${userId}`, 'e2e-playlist')
      },
      { trackJson: track, userId: 'user1' }
    )

    await page.goto('/favorites')
    await expect(page.getByText(track.name)).toBeVisible({ timeout: 10000 })

    // Click remove button on the track row
    await page.getByRole('button', { name: /remover|remove/i }).first().click()

    await expect(page.getByText(track.name)).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('Favorites — heart no MiniPlayer', () => {
  test('heart button aparece quando há uma track tocando', async ({ page }) => {
    const track = mockTracks[0]

    // Override player endpoint to return an active track
    await page.route(/^https:\/\/api\.spotify\.com\/v1\/me\/player(?:\?.*)?$/, (route) =>
      route.fulfill({
        json: {
          is_playing: true,
          progress_ms: 30000,
          item: track,
          repeat_state: 'off',
          shuffle_state: false,
        },
      })
    )

    await page.goto('/')

    // Heart button aria-label: "Adicionar à Spoter List" or "Remover da Spoter List"
    const heartBtn = page.getByRole('button', { name: /spoter list/i })
    await expect(heartBtn).toBeVisible({ timeout: 10000 })
  })

  test('clicar no heart adiciona a track aos favoritos', async ({ page }) => {
    const track = mockTracks[0]

    await page.route(/^https:\/\/api\.spotify\.com\/v1\/me\/player(?:\?.*)?$/, (route) =>
      route.fulfill({
        json: {
          is_playing: true,
          progress_ms: 30000,
          item: track,
          repeat_state: 'off',
          shuffle_state: false,
        },
      })
    )

    // Set playlist id in localStorage to avoid creation flow
    await page.addInitScript(({ userId }) => {
      localStorage.setItem(`spoter_playlist_${userId}`, 'e2e-playlist')
    }, { userId: 'user1' })

    await page.goto('/')

    const heartBtn = page.getByRole('button', { name: /adicionar à spoter list|add to spoter list/i })
    await heartBtn.waitFor({ timeout: 10000 })
    await heartBtn.click()

    // After clicking, the track is in localStorage — navigate to favorites to verify
    await page.goto('/favorites')
    await expect(page.getByText(track.name)).toBeVisible({ timeout: 5000 })
  })
})
```

- [ ] **Step 2: Run the full E2E suite**

```bash
yarn test:e2e tests-e2e/favorites.spec.ts
```

Expected: all tests pass (5 existing + new scenarios).

- [ ] **Step 3: Commit**

```bash
git add tests-e2e/favorites.spec.ts
git commit -m "test(e2e): full favorites flow — add, remove, empty state, heart button"
```

---

### Task 10: Full test run and cleanup

- [ ] **Step 1: Run all unit tests**

```bash
yarn test
```

Expected: all pass with no warnings.

- [ ] **Step 2: Run full E2E suite**

```bash
yarn test:e2e
```

Expected: all pass. If any test is flaky due to timing, add `await page.waitForLoadState('networkidle')` before assertions on that test.

- [ ] **Step 3: Run lint**

```bash
yarn lint
```

Expected: `Done` with no warnings.

- [ ] **Step 4: Push**

```bash
git pull --rebase
git push
```

---

## Self-Review

**Spec coverage check:**
- ✅ `useFavoriteStorage` — Task 1 (addTrack, dedup, removeTrack, notes, replace, event reaction)
- ✅ `useIsTrackFavorite` — Task 2 (null uri, empty userId, miss, hit, reactive update)
- ✅ `AddFavoriteForm` — Task 3 (disabled without track, already-favorite warning+disable, submit with/without note, counter)
- ✅ `TrackAutocomplete` — Task 4 (query length gate, results shown, click selects, SelectedTrack, clear)
- ✅ `FavoriteButton` — Task 5 (null no track, add/remove calls, aria-label, toast)
- ✅ `Favorites` page — Task 6 (empty state, list render, skeleton, popover toggle)
- ✅ `useSpoterPlaylist` lazy creation — Task 7 (no playlistId, createPlaylist called, local add, existing skips create)
- ✅ E2E fixture extension — Task 8 (track search, playlist items POST)
- ✅ E2E full flow — Task 9 (add flow, add with note, remove, empty state, heart button)

**Placeholder scan:** No TBDs, TODOs, or incomplete steps found.

**Type consistency:** `mockTrack` helper returns full `SpotifyTrack`. `vi.mocked(useUserPlaylists).mockReturnValue` cast to `ReturnType<typeof useUserPlaylists>` satisfies TS. `mockCreateMutate` and `mockAddMutate` are captured at module level via hoisting-safe declaration (not inside arrow functions).
