# Reordenação de Favoritos — Plano de Implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: Use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano task-by-task. Os passos usam sintaxe de checkbox (`- [ ]`) para rastreamento.

**Goal:** Adicionar reordenação de tracks na tela `/favorites` via drag-and-drop e edição de número, sincronizando com o Spotify, com botão de refresh e ajustes visuais de consistência.

**Architecture:** framer-motion `Reorder.Group/Item` (já instalado) gerencia o drag em `Favorites.tsx` com estado local `sortedTracks` + refs para evitar closure stale. O hook `useSpoterPlaylist` recebe `reorderTrack` e `refresh` que atualizam local state + `localStorage` + Spotify API. O componente `Tooltip` é estendido com `align`/`maxWidth`/`className` e substituí a implementação inline em `TrackRow`.

**Tech Stack:** React, TypeScript, framer-motion Reorder, TanStack Query useMutation, Spotify Web API `PUT /playlists/{id}/tracks`, lucide-react, i18next

---

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/components/shared/Tooltip.tsx` | Modificar | Adicionar props `align`, `maxWidth`, `className` |
| `src/components/shared/__tests__/Tooltip.test.tsx` | Modificar | Testes para novas props |
| `src/components/shared/TrackRow.tsx` | Modificar | Substituir tooltip inline + prop `onReorderTo` |
| `src/components/shared/__tests__/TrackRow.test.tsx` | Modificar | Testes para `onReorderTo` |
| `src/components/favorites/TrackAutocomplete.tsx` | Modificar | Fix glassmorphism no `ResultsList` |
| `src/hooks/mutations/useReorderPlaylistTracks.ts` | Criar | `PUT /playlists/{id}/tracks` |
| `src/locales/pt-BR.json` | Modificar | Strings novas |
| `src/locales/en-US.json` | Modificar | Strings novas |
| `src/hooks/useSpoterPlaylist.ts` | Modificar | `reorderTrack`, `refresh`, `isRefreshing` |
| `src/hooks/__tests__/useSpoterPlaylist.test.ts` | Modificar | Testes para `reorderTrack` |
| `src/pages/Favorites.tsx` | Modificar | `Reorder.Group`, drag handles, refresh button, Inter font |

---

## Task 1: Unificar componente Tooltip

**Files:**
- Modify: `src/components/shared/Tooltip.tsx`
- Modify: `src/components/shared/__tests__/Tooltip.test.tsx`

- [ ] **Passo 1: Escrever testes que falham para as novas props**

Substituir o conteúdo de `src/components/shared/__tests__/Tooltip.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Tooltip } from '../Tooltip'

describe('Tooltip', () => {
  it('renderiza os children corretamente', () => {
    render(
      <Tooltip content="Texto de ajuda">
        <button>Hover</button>
      </Tooltip>
    )
    expect(screen.getByText('Hover')).toBeInTheDocument()
  })

  it('renderiza o conteúdo do tooltip no documento (oculto via css)', () => {
    render(
      <Tooltip content="Texto de ajuda">
        <button>Hover</button>
      </Tooltip>
    )
    expect(screen.getByText('Texto de ajuda')).toBeInTheDocument()
  })

  it('aplica alinhamento start quando align="start"', () => {
    render(
      <Tooltip content="Nota" align="start">
        <span>trigger</span>
      </Tooltip>
    )
    const tip = screen.getByText('Nota')
    expect(tip.className).toContain('left-0')
    expect(tip.className).not.toContain('-translate-x-1/2')
  })

  it('aplica whitespace-normal e maxWidth quando maxWidth fornecido', () => {
    render(
      <Tooltip content="Nota longa" maxWidth="max-w-xs">
        <span>trigger</span>
      </Tooltip>
    )
    const tip = screen.getByText('Nota longa')
    expect(tip.className).toContain('whitespace-normal')
    expect(tip.className).toContain('max-w-xs')
  })

  it('aplica className no wrapper quando fornecido', () => {
    render(
      <Tooltip content="Nota" className="flex-1 min-w-0 block">
        <span>trigger</span>
      </Tooltip>
    )
    // wrapper é o span pai do tooltip content
    const wrapper = screen.getByText('trigger').parentElement
    expect(wrapper?.className).toContain('flex-1')
  })
})
```

- [ ] **Passo 2: Rodar testes e verificar falha**

```bash
yarn test src/components/shared/__tests__/Tooltip.test.tsx --reporter=verbose
```

Esperado: os 3 novos testes FAIL (props não existem ainda).

- [ ] **Passo 3: Implementar novas props no Tooltip**

Substituir `src/components/shared/Tooltip.tsx`:

```tsx
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  align?: 'center' | 'start'
  maxWidth?: string
  className?: string
}

export function Tooltip({
  content,
  children,
  align = 'center',
  maxWidth,
  className,
}: TooltipProps) {
  const alignClass = align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0'
  const widthClass = maxWidth ? cn('whitespace-normal w-max', maxWidth) : 'whitespace-nowrap'

  return (
    <span className={cn('relative group/tooltip inline-block', className)}>
      {children}
      <span
        className={cn(
          'pointer-events-none absolute bottom-full mb-1 rounded-md bg-black/80 px-2 py-1',
          'text-xs text-white opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150 z-50',
          alignClass,
          widthClass
        )}
      >
        {content}
      </span>
    </span>
  )
}
```

- [ ] **Passo 4: Rodar testes e verificar que passam**

```bash
yarn test src/components/shared/__tests__/Tooltip.test.tsx --reporter=verbose
```

Esperado: 5 testes PASS.

- [ ] **Passo 5: Commit**

```bash
git add src/components/shared/Tooltip.tsx src/components/shared/__tests__/Tooltip.test.tsx
git commit -m "feat: estender Tooltip com align, maxWidth e className"
```

---

## Task 2: Usar Tooltip unificado em TrackRow + prop onReorderTo

**Files:**
- Modify: `src/components/shared/TrackRow.tsx`
- Modify: `src/components/shared/__tests__/TrackRow.test.tsx`

- [ ] **Passo 1: Escrever testes que falham para as mudanças**

Adicionar ao final de `src/components/shared/__tests__/TrackRow.test.tsx` (após os testes existentes):

```tsx
  it('mostra número como botão clicável quando onReorderTo é fornecido', () => {
    render(<TrackRow track={track} index={2} onReorderTo={vi.fn()} />)
    // O número vira um button separado para edição
    expect(screen.getByRole('button', { name: /reordenar/i })).toBeInTheDocument()
  })

  it('exibe input ao clicar no número quando onReorderTo é fornecido', async () => {
    const user = userEvent.setup()
    render(<TrackRow track={track} index={2} onReorderTo={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /reordenar/i }))
    expect(screen.getByRole('spinbutton')).toBeInTheDocument()
    expect(screen.getByRole('spinbutton')).toHaveValue(3) // 1-based
  })

  it('chama onReorderTo com índice 0-based ao confirmar com Enter', async () => {
    const user = userEvent.setup()
    const onReorderTo = vi.fn()
    render(<TrackRow track={track} index={2} onReorderTo={onReorderTo} />)
    await user.click(screen.getByRole('button', { name: /reordenar/i }))
    const input = screen.getByRole('spinbutton')
    await user.clear(input)
    await user.type(input, '1')
    await user.keyboard('{Enter}')
    expect(onReorderTo).toHaveBeenCalledWith(0) // 1-based "1" → 0-based 0
  })

  it('fecha input sem chamar onReorderTo ao pressionar Escape', async () => {
    const user = userEvent.setup()
    const onReorderTo = vi.fn()
    render(<TrackRow track={track} index={2} onReorderTo={onReorderTo} />)
    await user.click(screen.getByRole('button', { name: /reordenar/i }))
    await user.keyboard('{Escape}')
    expect(onReorderTo).not.toHaveBeenCalled()
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
  })
```

- [ ] **Passo 2: Rodar testes e verificar falha**

```bash
yarn test src/components/shared/__tests__/TrackRow.test.tsx --reporter=verbose
```

Esperado: 4 novos testes FAIL.

- [ ] **Passo 3: Implementar mudanças em TrackRow**

Substituir o conteúdo completo de `src/components/shared/TrackRow.tsx`:

```tsx
import { useState } from 'react'
import { Play, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDuration } from '@/utils/formatDuration'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/shared/Tooltip'
import type { SpotifyTrack, SpotifyAlbumTrack } from '@/types/spotify'

interface TrackRowProps {
  track: SpotifyTrack | SpotifyAlbumTrack
  isActive?: boolean
  onPlay?: (track: SpotifyTrack | SpotifyAlbumTrack) => void
  onRemove?: (uri: string) => void
  onReorderTo?: (newIndex: number) => void
  note?: string
  index?: number
  theme?: 'light' | 'dark'
}

interface TrackTheme {
  row: string
  number: string
  icon: string
  text: string
  subtext: string
  duration: string
  remove: string
}

function resolveTextColor(dark: boolean, isActive: boolean): string {
  if (dark) return isActive ? 'text-white' : 'text-white/80'
  return isActive ? 'text-black' : 'text-black/80'
}

function buildTrackTheme(dark: boolean, isActive: boolean): TrackTheme {
  return {
    row: cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer group focus:outline-none',
      dark
        ? cn('hover:bg-white/5', isActive && 'bg-white/10')
        : cn('hover:bg-black/5', isActive && 'bg-black/[0.04]')
    ),
    number: cn(
      'text-xs font-bold tabular-nums group-hover:hidden',
      dark ? 'text-white/30' : 'text-black/30'
    ),
    icon: dark ? 'fill-white text-white' : 'fill-black text-black',
    text: cn('text-sm font-medium truncate', resolveTextColor(dark, isActive)),
    subtext: cn('text-xs truncate', dark ? 'text-white/40' : 'text-black/40'),
    duration: cn('text-xs tabular-nums shrink-0', dark ? 'text-white/20' : 'text-black/30'),
    remove: cn(
      'p-1 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0 focus:outline-none focus:opacity-100',
      dark ? 'text-white/30 hover:text-red-400' : 'text-black/30 hover:text-red-500'
    ),
  }
}

function isActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' '
}

// IndexCell: renderizado FORA de qualquer <button> quando onReorderTo está presente,
// evitando aninhamento de elementos interativos (HTML inválido).
interface IndexCellProps {
  index: number
  theme: TrackTheme
  onReorderTo: (newIndex: number) => void
  trackName: string
}

function IndexCell({ index, theme, onReorderTo, trackName }: IndexCellProps) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState(String(index + 1))

  const display = String(index + 1).padStart(2, '0')

  function confirm() {
    const parsed = parseInt(inputVal, 10)
    if (!isNaN(parsed) && parsed >= 1) {
      onReorderTo(parsed - 1)
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        type="number"
        min={1}
        value={inputVal}
        autoFocus
        className="w-10 text-xs font-bold tabular-nums text-center bg-black/10 rounded focus:outline-none focus:ring-1 focus:ring-black/30"
        onChange={(e) => { setInputVal(e.target.value) }}
        onBlur={confirm}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); confirm() }
          if (e.key === 'Escape') { e.stopPropagation(); setEditing(false) }
        }}
        onClick={(e) => { e.stopPropagation() }}
      />
    )
  }

  return (
    <button
      aria-label={t('favorites.reorderPosition', { name: trackName })}
      onClick={(e) => {
        e.stopPropagation()
        setInputVal(String(index + 1))
        setEditing(true)
      }}
      className={cn('text-xs font-bold tabular-nums w-6 text-center', theme.number, 'hover:!text-black/60 cursor-pointer')}
    >
      {display}
    </button>
  )
}

export function TrackRow({
  track,
  isActive = false,
  onPlay,
  onRemove,
  onReorderTo,
  note,
  index,
  theme = 'light',
}: TrackRowProps) {
  const { t } = useTranslation()
  const s = buildTrackTheme(theme === 'dark', isActive)

  const albumImage = 'album' in track ? track.album.images[0]?.url : undefined
  const artistNames = 'artists' in track ? track.artists.map((a) => a.name).join(', ') : ''

  const nameBlock = (
    <>
      <p className={s.text}>{track.name}</p>
      <p className={s.subtext}>{artistNames}</p>
    </>
  )

  return (
    <div
      className={s.row}
      onClick={() => onPlay?.(track)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (isActivationKey(e.key)) {
          e.preventDefault()
          onPlay?.(track)
        }
      }}
    >
      {/* Play icon / index number.
          IndexCell é renderizado FORA de <button> quando onReorderTo está presente,
          evitando botão aninhado dentro de botão (HTML inválido). */}
      {index !== undefined && onReorderTo ? (
        <IndexCell index={index} theme={s} onReorderTo={onReorderTo} trackName={track.name} />
      ) : (
        <button
          className="w-6 shrink-0 flex items-center justify-center focus:outline-none"
          aria-label={t('player.playTrack', { name: track.name })}
          onClick={(e) => { e.stopPropagation(); onPlay?.(track) }}
        >
          {index !== undefined ? (
            <>
              <span className={s.number}>{String(index + 1).padStart(2, '0')}</span>
              <Play size={12} className={cn('hidden group-hover:block', s.icon)} />
            </>
          ) : (
            <Play size={12} className={s.icon} />
          )}
        </button>
      )}

      {/* Album cover */}
      {albumImage && (
        <img src={albumImage} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
      )}

      {/* Name + artist */}
      {note ? (
        <Tooltip
          content={note}
          align="start"
          maxWidth="max-w-xs"
          className="flex-1 min-w-0 block"
        >
          {nameBlock}
        </Tooltip>
      ) : (
        <div className="flex-1 min-w-0">{nameBlock}</div>
      )}

      {/* Duration */}
      <span className={s.duration}>{formatDuration(track.duration_ms)}</span>

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(track.uri)
          }}
          aria-label={t('favorites.removeConfirm')}
          className={s.remove}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}
```

- [ ] **Passo 4: Rodar testes e verificar que passam**

```bash
yarn test src/components/shared/__tests__/TrackRow.test.tsx --reporter=verbose
```

Esperado: todos os testes PASS (novos + existentes).

- [ ] **Passo 5: Commit**

```bash
git add src/components/shared/TrackRow.tsx src/components/shared/__tests__/TrackRow.test.tsx
git commit -m "feat: TrackRow com tooltip unificado e prop onReorderTo para edição de posição"
```

---

## Task 3: Fix glassmorphism no ResultsList

**Files:**
- Modify: `src/components/favorites/TrackAutocomplete.tsx`

- [ ] **Passo 1: Aplicar fix visual no ResultsList**

Em `src/components/favorites/TrackAutocomplete.tsx`, localizar o componente `ResultsList` e substituir a classe `bg-white` por `bg-white/90 backdrop-blur-sm`:

```tsx
// Antes — linha com className do <ul>:
className="absolute top-full rounded-xl rounded-t-none h-[160px] mt-1 left-0 right-0 bg-white overflow-y-auto max-h-60 z-50 shadow-xl"

// Depois:
className="absolute top-full rounded-xl rounded-t-none h-[160px] mt-1 left-0 right-0 bg-white/90 backdrop-blur-sm overflow-y-auto max-h-60 z-50 shadow-xl"
```

- [ ] **Passo 2: Verificar lint passa**

```bash
yarn lint
```

Esperado: Done, sem warnings.

- [ ] **Passo 3: Commit**

```bash
git add src/components/favorites/TrackAutocomplete.tsx
git commit -m "fix: glassmorphism no dropdown de busca de favoritos"
```

---

## Task 4: Strings i18n

**Files:**
- Modify: `src/locales/pt-BR.json`
- Modify: `src/locales/en-US.json`

- [ ] **Passo 1: Adicionar strings em pt-BR.json**

Dentro do objeto `"favorites"` em `src/locales/pt-BR.json`, adicionar após `"clearTrack"`:

```json
"refreshFromSpotify": "Atualizar do Spotify",
"reorderError": "Erro ao reordenar. A ordem anterior foi restaurada.",
"refreshError": "Erro ao atualizar da Spotify.",
"reorderPosition": "Editar posição de {{name}}"
```

- [ ] **Passo 2: Adicionar strings em en-US.json**

Dentro do objeto `"favorites"` em `src/locales/en-US.json`, adicionar após `"clearTrack"`:

```json
"refreshFromSpotify": "Refresh from Spotify",
"reorderError": "Reorder failed. Previous order restored.",
"refreshError": "Failed to refresh from Spotify.",
"reorderPosition": "Edit position of {{name}}"
```

- [ ] **Passo 3: Verificar lint passa**

```bash
yarn lint
```

Esperado: Done, sem warnings.

- [ ] **Passo 4: Commit**

```bash
git add src/locales/pt-BR.json src/locales/en-US.json
git commit -m "feat: strings i18n para reordenação e refresh de favoritos"
```

---

## Task 5: Mutation useReorderPlaylistTracks

**Files:**
- Create: `src/hooks/mutations/useReorderPlaylistTracks.ts`

- [ ] **Passo 1: Criar o arquivo da mutation**

Criar `src/hooks/mutations/useReorderPlaylistTracks.ts`:

```ts
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/axios'

interface ReorderVars {
  playlistId: string
  rangeStart: number
  insertBefore: number
}

export function useReorderPlaylistTracks() {
  return useMutation<undefined, Error, ReorderVars>({
    mutationFn: async ({ playlistId, rangeStart, insertBefore }) => {
      await api.put(`/playlists/${playlistId}/tracks`, {
        range_start: rangeStart,
        insert_before: insertBefore,
      })
    },
  })
}
```

- [ ] **Passo 2: Verificar build sem erros**

```bash
yarn build 2>&1 | tail -5
```

Esperado: `✓ built in ...`

- [ ] **Passo 3: Commit**

```bash
git add src/hooks/mutations/useReorderPlaylistTracks.ts
git commit -m "feat: mutation useReorderPlaylistTracks para PUT /playlists/{id}/tracks"
```

---

## Task 6: Hook useSpoterPlaylist — reorderTrack + refresh

**Files:**
- Modify: `src/hooks/useSpoterPlaylist.ts`
- Modify: `src/hooks/__tests__/useSpoterPlaylist.test.ts`

- [ ] **Passo 1: Escrever testes que falham**

Adicionar ao final do `describe('useSpoterPlaylist')` em `src/hooks/__tests__/useSpoterPlaylist.test.ts`:

Primeiro, atualizar o import de `favStorage` no topo do arquivo para incluir `readLocalTracks`:

```ts
// Antes:
import { writeLocalTracks } from '@/utils/favStorage'

// Depois:
import { writeLocalTracks, readLocalTracks } from '@/utils/favStorage'
```

Em seguida, adicionar o mock da nova mutation no topo do arquivo (junto com os outros mocks):

```ts
vi.mock('@/hooks/mutations/useReorderPlaylistTracks', () => ({
  useReorderPlaylistTracks: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))
vi.mock('@/lib/axios', () => ({
  default: { get: vi.fn() },
}))
```

Adicionar os testes no `describe`:

```ts
  describe('reorderTrack', () => {
    it('move track para frente na lista', () => {
      writeLocalTracks('user-1', [mockTrack('t1'), mockTrack('t2'), mockTrack('t3')])
      const { result } = renderHook(() => useSpoterPlaylist())

      act(() => {
        result.current.reorderTrack(0, 2)
      })

      expect(result.current.tracks[0].id).toBe('t2')
      expect(result.current.tracks[1].id).toBe('t3')
      expect(result.current.tracks[2].id).toBe('t1')
    })

    it('move track para trás na lista', () => {
      writeLocalTracks('user-1', [mockTrack('t1'), mockTrack('t2'), mockTrack('t3')])
      const { result } = renderHook(() => useSpoterPlaylist())

      act(() => {
        result.current.reorderTrack(2, 0)
      })

      expect(result.current.tracks[0].id).toBe('t3')
      expect(result.current.tracks[1].id).toBe('t1')
      expect(result.current.tracks[2].id).toBe('t2')
    })

    it('não faz nada quando fromIndex === toIndex', () => {
      writeLocalTracks('user-1', [mockTrack('t1'), mockTrack('t2')])
      const { result } = renderHook(() => useSpoterPlaylist())
      const before = [...result.current.tracks]

      act(() => {
        result.current.reorderTrack(1, 1)
      })

      expect(result.current.tracks).toEqual(before)
    })

    it('faz clamp de toIndex quando maior que o tamanho da lista', () => {
      writeLocalTracks('user-1', [mockTrack('t1'), mockTrack('t2'), mockTrack('t3')])
      const { result } = renderHook(() => useSpoterPlaylist())

      act(() => {
        result.current.reorderTrack(0, 99)
      })

      expect(result.current.tracks[2].id).toBe('t1')
    })

    it('persiste nova ordem no localStorage', () => {
      writeLocalTracks('user-1', [mockTrack('t1'), mockTrack('t2'), mockTrack('t3')])
      const { result } = renderHook(() => useSpoterPlaylist())

      act(() => {
        result.current.reorderTrack(0, 2)
      })

      // readLocalTracks já está importado no topo do arquivo de teste
      const saved = readLocalTracks('user-1')
      expect(saved[2].id).toBe('t1')
    })
  })
```

- [ ] **Passo 2: Rodar testes e verificar falha**

```bash
yarn test src/hooks/__tests__/useSpoterPlaylist.test.ts --reporter=verbose
```

Esperado: novos testes FAIL (`reorderTrack is not a function`).

- [ ] **Passo 3: Implementar reorderTrack e refresh em useSpoterPlaylist**

Adicionar imports no topo de `src/hooks/useSpoterPlaylist.ts`:

```ts
import { useReorderPlaylistTracks } from '@/hooks/mutations/useReorderPlaylistTracks'
import { useToast } from '@/components/ui/toast'
import api from '@/lib/axios'
import type { PlaylistTracksResponse } from '@/types/spotify'
```

Adicionar dentro da função `useSpoterPlaylist`, após as outras mutations (`addMutation`, `removeMutation`):

```ts
  // t já existe no topo da função via useTranslation()
  const { toast } = useToast()
  const reorderMutation = useReorderPlaylistTracks()
  const [isRefreshing, setIsRefreshing] = useState(false)
```

Adicionar as funções `reorderTrack` e `refresh` (antes do `return`):

```ts
  const reorderTrack = useCallback(
    (fromIndex: number, toIndex: number) => {
      const clampedTo = Math.max(0, Math.min(toIndex, tracksRef.current.length - 1))
      if (fromIndex === clampedTo) return

      const insertBefore = clampedTo > fromIndex ? clampedTo + 1 : clampedTo
      const prevTracks = [...tracksRef.current]

      const newTracks = [...prevTracks]
      const [moved] = newTracks.splice(fromIndex, 1)
      newTracks.splice(clampedTo, 0, moved)

      writeLocalTracks(userId, newTracks)
      setLocalTracks(newTracks)

      if (playlistId) {
        reorderMutation.mutate(
          { playlistId, rangeStart: fromIndex, insertBefore },
          {
            onError: () => {
              writeLocalTracks(userId, prevTracks)
              setLocalTracks(prevTracks)
              toast(t('favorites.reorderError'), 'error')
            },
          }
        )
      }
    },
    [userId, playlistId, reorderMutation, toast, t]
  )

  const refresh = useCallback(async () => {
    if (!playlistId || !userId) return
    setIsRefreshing(true)
    try {
      const { data } = await api.get<PlaylistTracksResponse>(`/playlists/${playlistId}/items`, {
        params: { limit: 50, offset: 0 },
      })
      const refreshedTracks = data.items.map((item) => item.item)
      writeLocalTracks(userId, refreshedTracks)
      setLocalTracks(refreshedTracks)
    } catch {
      toast(t('favorites.refreshError'), 'error')
    } finally {
      setIsRefreshing(false)
    }
  }, [playlistId, userId, toast, t])
```

Adicionar `reorderTrack`, `refresh`, `isRefreshing` no objeto `return` do hook:

```ts
  return {
    playlistId,
    playlistName,
    tracks: localTracks,
    notes: localNotes,
    addTrack,
    removeTrack,
    updateNote,
    reorderTrack,
    refresh,
    isRefreshing,
    isLoading: isHydrating && localTracks.length === 0,
  }
```

**Atenção:** `useTranslation` já é importado no topo do arquivo. Verificar se `t` já está declarado — se sim, não declarar novamente.

- [ ] **Passo 4: Rodar testes e verificar que passam**

```bash
yarn test src/hooks/__tests__/useSpoterPlaylist.test.ts --reporter=verbose
```

Esperado: todos os testes PASS.

- [ ] **Passo 5: Verificar build**

```bash
yarn build 2>&1 | tail -5
```

Esperado: `✓ built in ...`

- [ ] **Passo 6: Commit**

```bash
git add src/hooks/useSpoterPlaylist.ts src/hooks/__tests__/useSpoterPlaylist.test.ts
git commit -m "feat: reorderTrack e refresh em useSpoterPlaylist com rollback em caso de erro"
```

---

## Task 7: Favorites.tsx — drag UI, refresh button, Inter font

**Files:**
- Modify: `src/pages/Favorites.tsx`

- [ ] **Passo 1: Substituir o conteúdo de Favorites.tsx**

```tsx
import { useState, useRef, useCallback, useEffect } from 'react'
import { Music, Plus, X, GripVertical, RefreshCw } from 'lucide-react'
import { AnimatePresence, motion, Reorder } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { usePlayer } from '@/hooks/usePlayer'
import { useSpoterPlaylist } from '@/hooks/useSpoterPlaylist'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { usePopoverDismiss } from '@/hooks/usePopoverDismiss'
import { EmptyState } from '@/components/shared/EmptyState'
import { Tooltip } from '@/components/shared/Tooltip'
import { AddFavoriteForm } from '@/components/favorites/AddFavoriteForm'
import { TrackRow } from '@/components/shared/TrackRow'
import { TrackRowSkeleton } from '@/components/shared/TrackRowSkeleton'
import type { SpotifyTrack } from '@/types/spotify'

export function Favorites() {
  const { t } = useTranslation()
  const { state: playerState } = usePlayer()
  const {
    tracks,
    notes,
    addTrack,
    removeTrack,
    reorderTrack,
    refresh,
    isRefreshing,
    isLoading,
    playlistId,
    playlistName,
  } = useSpoterPlaylist()
  const playTrack = usePlayTrack()
  const [open, setOpen] = useState(false)

  // Estado local para animação fluida durante drag
  const [sortedTracks, setSortedTracks] = useState<SpotifyTrack[]>(tracks)
  const sortedTracksRef = useRef<SpotifyTrack[]>(tracks)
  const originalOrderRef = useRef<SpotifyTrack[]>(tracks)

  // Sincroniza quando tracks muda externamente (ex: após reorder ou refresh)
  useEffect(() => {
    setSortedTracks(tracks)
    sortedTracksRef.current = tracks
  }, [tracks])

  function handleReorder(newOrder: SpotifyTrack[]) {
    setSortedTracks(newOrder)
    sortedTracksRef.current = newOrder
  }

  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setOpen(false)
  }, [])

  usePopoverDismiss(open, close, buttonRef, popoverRef)

  return (
    <div className="min-h-screen pt-16 px-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6 pt-6">
          <div>
            <h1
              className="text-2xl font-black text-black"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {t('nav.favorites')}
            </h1>
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

          <div className="flex items-center gap-2">
            {/* Botão refresh */}
            <Tooltip content={t('favorites.refreshFromSpotify')}>
              <button
                onClick={() => { void refresh() }}
                disabled={isRefreshing}
                className="p-2 glass rounded-full text-black/50 hover:text-black/80 transition-colors disabled:opacity-40"
                aria-label={t('favorites.refreshFromSpotify')}
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            </Tooltip>

            {/* Botão adicionar */}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={() => { setOpen((v) => !v) }}
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
        </div>

        {isLoading && <TrackRowSkeleton count={6} />}

        {!isLoading && tracks.length === 0 && (
          <EmptyState message={t('favorites.emptyList')} icon={<Music size={32} />} />
        )}

        {!isLoading && sortedTracks.length > 0 && (
          <Reorder.Group
            axis="y"
            values={sortedTracks}
            onReorder={handleReorder}
            className="flex flex-col gap-0.5"
          >
            {sortedTracks.map((track, i) => (
              <Reorder.Item
                key={track.id}
                value={track}
                className="flex items-center"
                onDragStart={() => {
                  originalOrderRef.current = [...sortedTracksRef.current]
                }}
                onDragEnd={() => {
                  const from = originalOrderRef.current.findIndex((t) => t.id === track.id)
                  const to = sortedTracksRef.current.findIndex((t) => t.id === track.id)
                  if (from !== to) reorderTrack(from, to)
                }}
              >
                <GripVertical
                  size={16}
                  className="text-black/20 hover:text-black/50 shrink-0 cursor-grab active:cursor-grabbing ml-1"
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <TrackRow
                    track={track}
                    index={i}
                    note={notes[track.uri] || undefined}
                    isActive={playerState.currentTrack?.uri === track.uri}
                    onPlay={async (tr) => playTrack(tr as SpotifyTrack)}
                    onRemove={removeTrack}
                    onReorderTo={(newIdx) => { reorderTrack(i, newIdx) }}
                  />
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Passo 2: Rodar lint e build**

```bash
yarn lint && yarn build 2>&1 | tail -5
```

Esperado: lint sem warnings, build `✓ built in ...`

- [ ] **Passo 3: Rodar todos os testes**

```bash
yarn test --reporter=verbose 2>&1 | tail -30
```

Esperado: todos os testes PASS.

- [ ] **Passo 4: Commit**

```bash
git add src/pages/Favorites.tsx
git commit -m "feat: drag-and-drop, refresh e Inter font na tela de favoritos"
```

---

## Task 8: Push final

- [ ] **Passo 1: Push**

```bash
git pull --rebase && git push && git status
```

Esperado: `Your branch is up to date with 'origin/main'.`
