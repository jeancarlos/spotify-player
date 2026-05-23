# Spoter Redesign — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruir todo o visual do Spoter (fundo branco, disco de vinil, cards em arco, frosted glass) mantendo intacta a camada de dados, e corrigir os 3 bugs conhecidos do player.

**Architecture:** Big Bang nos arquivos visuais (pages/, components/ visuais, styles/) preservando lib/, contexts/, hooks/ e types/. Player recebe fixes de progress timer, device errors e SET_TRACK→playback antes do redesign visual. Novos componentes vinyl/ + layout shell reconstruído.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 3, framer-motion 11, recharts 2, React Query v5, React Hook Form + Zod, i18next.

**Spec:** `docs/superpowers/specs/2026-05-22-spoter-redesign.md`

---

## Fase 0 — Cleanup

### Task 1: Big Bang — remover arquivos visuais obsoletos

**Files:**
- Delete: `src/styles/glass.css`
- Delete: `src/components/layout/DynamicBackground.tsx`
- Delete: `src/components/layout/FullscreenPlayer.tsx`
- Delete: `src/components/layout/Sidebar.tsx`
- Delete: `src/components/shared/GlassCard.tsx`
- Delete: `src/components/shared/SectionRow.tsx`
- Delete: `src/components/shared/TrackCard.tsx`
- Delete: `src/components/shared/AlbumCard.tsx`
- Delete: `src/components/ui/badge.tsx`
- Delete: `src/assets/hero.png` `src/assets/react.svg` `src/assets/vite.svg`

- [ ] **Step 1: Deletar arquivos**
```bash
cd /home/jean/spotify-player
rm src/styles/glass.css
rm src/components/layout/DynamicBackground.tsx
rm src/components/layout/FullscreenPlayer.tsx
rm src/components/layout/Sidebar.tsx
rm src/components/shared/GlassCard.tsx
rm src/components/shared/SectionRow.tsx
rm src/components/shared/TrackCard.tsx
rm src/components/shared/AlbumCard.tsx
rm src/components/ui/badge.tsx
rm src/assets/hero.png src/assets/react.svg src/assets/vite.svg 2>/dev/null || true
```

- [ ] **Step 2: Commit**
```bash
git add -A
git commit -m "chore: remove arquivos visuais obsoletos (big bang cleanup)"
```

---

## Fase 1 — Correções do Player

### Task 2: playerReducer — action TICK_PROGRESS

**Files:**
- Modify: `src/contexts/playerReducer.ts`
- Test: `src/contexts/__tests__/playerReducer.test.ts`

- [ ] **Step 1: Escrever teste**

Abrir `src/contexts/__tests__/playerReducer.test.ts` e adicionar ao final:

```typescript
describe('TICK_PROGRESS', () => {
  it('incrementa progress em 1000ms quando abaixo do duration', () => {
    const state = { ...initialPlayerState, progress: 5000, duration: 30000, isPlaying: true }
    const next = playerReducer(state, { type: 'TICK_PROGRESS' })
    expect(next.progress).toBe(6000)
  })

  it('não ultrapassa duration', () => {
    const state = { ...initialPlayerState, progress: 29500, duration: 30000, isPlaying: true }
    const next = playerReducer(state, { type: 'TICK_PROGRESS' })
    expect(next.progress).toBe(30000)
  })

  it('não avança quando duration é 0', () => {
    const state = { ...initialPlayerState, progress: 0, duration: 0 }
    const next = playerReducer(state, { type: 'TICK_PROGRESS' })
    expect(next.progress).toBe(0)
  })
})
```

- [ ] **Step 2: Verificar que o teste falha**
```bash
npx vitest run src/contexts/__tests__/playerReducer.test.ts
```
Esperado: FAIL — "TICK_PROGRESS is not handled"

- [ ] **Step 3: Implementar**

Em `src/contexts/playerReducer.ts`, adicionar à união de `PlayerAction`:
```typescript
| { type: 'TICK_PROGRESS' }
```

E ao `playerReducer` switch:
```typescript
case 'TICK_PROGRESS':
  if (state.duration === 0) return state
  return { ...state, progress: Math.min(state.progress + 1000, state.duration) }
```

- [ ] **Step 4: Rodar testes**
```bash
npx vitest run src/contexts/__tests__/playerReducer.test.ts
```
Esperado: PASS (todos os 3 casos)

- [ ] **Step 5: Commit**
```bash
git add src/contexts/playerReducer.ts src/contexts/__tests__/playerReducer.test.ts
git commit -m "fix: playerReducer — action TICK_PROGRESS para progresso local"
```

---

### Task 3: PlayerSync — timer de progresso + reverter estado em erro de API

**Files:**
- Modify: `src/components/layout/PlayerSync.tsx`

- [ ] **Step 1: Substituir conteúdo de `src/components/layout/PlayerSync.tsx`**

```typescript
import { useEffect, useRef } from 'react'
import { useNowPlaying } from '@/hooks/queries/useNowPlaying'
import { usePlayer } from '@/hooks/usePlayer'
import { useAuth } from '@/hooks/useAuth'
import { extractPalette } from '@/lib/colorThief'

export function PlayerSync() {
  const { state: authState } = useAuth()
  const { state, dispatch } = usePlayer()
  const { data } = useNowPlaying(authState.isAuthenticated)
  const lastTrackIdRef = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Timer local: incrementa progress a cada 1s enquanto tocando
  useEffect(() => {
    if (state.isPlaying && state.duration > 0) {
      timerRef.current = setInterval(() => {
        dispatch({ type: 'TICK_PROGRESS' })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [state.isPlaying, state.duration, dispatch])

  // Sincronizar com API Spotify (corrige drift)
  useEffect(() => {
    if (!data) return

    const remote = data.item
    const localId = state.currentTrack?.id

    if (remote && remote.id !== localId) {
      dispatch({ type: 'SET_TRACK', payload: remote })
    }

    if (data.is_playing !== state.isPlaying) {
      dispatch({ type: 'SET_PLAYING', payload: data.is_playing })
    }

    if (data.progress_ms !== null) {
      const drift = Math.abs(data.progress_ms - state.progress)
      if (drift > 3000) {
        dispatch({ type: 'SET_PROGRESS', payload: data.progress_ms })
      }
    }

    if (data.shuffle_state !== state.shuffle) {
      dispatch({ type: 'SET_SHUFFLE', payload: data.shuffle_state })
    }

    if (data.repeat_state !== state.repeat) {
      dispatch({ type: 'SET_REPEAT', payload: data.repeat_state })
    }
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  // Extração de paleta (não mais usada no novo design — mantida para compatibilidade)
  useEffect(() => {
    const track = state.currentTrack
    if (!track || track.id === lastTrackIdRef.current) return
    lastTrackIdRef.current = track.id

    const imageUrl = track.album.images[0]?.url
    if (!imageUrl) return

    extractPalette(imageUrl).then(palette => {
      if (palette) dispatch({ type: 'SET_PALETTE', payload: palette })
    })
  }, [state.currentTrack, dispatch])

  return null
}
```

- [ ] **Step 2: Commit**
```bash
git add src/components/layout/PlayerSync.tsx
git commit -m "fix: PlayerSync — timer local 1s para barra de progresso fluida"
```

---

### Task 4: usePlayTrack — centralizar lógica de play com fallback de device

**Files:**
- Create: `src/hooks/usePlayTrack.ts`
- Test: `src/hooks/__tests__/usePlayTrack.test.ts`

- [ ] **Step 1: Escrever teste**

Criar `src/hooks/__tests__/usePlayTrack.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePlayTrack } from '@/hooks/usePlayTrack'

// Mock dependencies
vi.mock('@/lib/axios', () => ({
  default: { put: vi.fn() },
}))
vi.mock('@/hooks/usePlayer', () => ({
  usePlayer: () => ({ state: { isPlaying: false }, dispatch: vi.fn() }),
}))
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

import api from '@/lib/axios'

const mockTrack = {
  id: 't1', uri: 'spotify:track:t1', name: 'Test',
  duration_ms: 200000, explicit: false, popularity: 80,
  preview_url: null, type: 'track' as const,
  artists: [{ id: 'a1', name: 'Artist', uri: 'spotify:artist:a1', type: 'artist' as const }],
  album: {
    id: 'al1', name: 'Album', images: [], release_date: '2024',
    album_type: 'album' as const, artists: [], uri: 'spotify:album:al1', type: 'album' as const,
  },
}

describe('usePlayTrack', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama PUT /me/player/play com uri correto', async () => {
    vi.mocked(api.put).mockResolvedValue({ status: 204 })
    const { result } = renderHook(() => usePlayTrack())
    await act(() => result.current(mockTrack))
    expect(api.put).toHaveBeenCalledWith('/me/player/play', { uris: ['spotify:track:t1'] })
  })

  it('não lança exceção quando API retorna 404 (sem device)', async () => {
    const err = Object.assign(new Error('no device'), { response: { status: 404 } })
    vi.mocked(api.put).mockRejectedValue(err)
    const { result } = renderHook(() => usePlayTrack())
    await expect(act(() => result.current(mockTrack))).resolves.not.toThrow()
  })
})
```

- [ ] **Step 2: Verificar que falha**
```bash
npx vitest run src/hooks/__tests__/usePlayTrack.test.ts
```
Esperado: FAIL — "Cannot find module usePlayTrack"

- [ ] **Step 3: Criar `src/hooks/usePlayTrack.ts`**

```typescript
import { useCallback } from 'react'
import { usePlayer } from '@/hooks/usePlayer'
import { useToast } from '@/components/ui/toast'
import { useTranslation } from 'react-i18next'
import api from '@/lib/axios'
import type { SpotifyTrack } from '@/types/spotify'
import type { AxiosError } from 'axios'

export function usePlayTrack() {
  const { dispatch } = usePlayer()
  const { toast } = useToast()
  const { t } = useTranslation()

  return useCallback(async (track: SpotifyTrack, queue: SpotifyTrack[] = []) => {
    dispatch({ type: 'SET_TRACK', payload: track })
    dispatch({ type: 'SET_PLAYING', payload: true })
    if (queue.length > 0) dispatch({ type: 'SET_QUEUE', payload: queue })

    try {
      await api.put('/me/player/play', { uris: [track.uri] })
    } catch (err) {
      const status = (err as AxiosError).response?.status
      if (status === 404 || status === 403) {
        toast(t('player.noActiveDevice'), 'info')
      }
    }
  }, [dispatch, toast, t])
}
```

- [ ] **Step 4: Rodar testes**
```bash
npx vitest run src/hooks/__tests__/usePlayTrack.test.ts
```
Esperado: PASS

- [ ] **Step 5: Commit**
```bash
git add src/hooks/usePlayTrack.ts src/hooks/__tests__/usePlayTrack.test.ts
git commit -m "fix: usePlayTrack — centraliza SET_TRACK + PUT /me/player/play com fallback 404"
```

---

## Fase 2 — Design Tokens

### Task 5: CSS — fundo branco, frosted glass, tipografia

**Files:**
- Modify: `src/index.css`
- Modify: `src/styles/globals.css`
- Modify: `src/components/ui/toast.tsx` (cores para fundo branco)

- [ ] **Step 1: Reescrever `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import './styles/globals.css';

@layer base {
  * {
    box-sizing: border-box;
  }
  body {
    background: #ffffff;
    color: #111111;
    font-family: 'Inter', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
}
```

- [ ] **Step 2: Reescrever `src/styles/globals.css`**

```css
/* Frosted glass — adaptado de ~/financas */
.glass {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.glass-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 1.25rem;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.05),
    0 1px 2px rgba(0, 0, 0, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.09),
    0 2px 4px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

- [ ] **Step 3: Atualizar cores do toast para fundo branco**

Em `src/components/ui/toast.tsx`, trocar `text-white/80` → `text-black/80`, `text-white/30` → `text-black/30`, e o `border-red-500/30` etc. mantêm. A div do toast deve ter fundo um pouco mais sólido:

Localizar a classe do `motion.div` do toast e substituir:
```tsx
// antes:
className={`pointer-events-auto flex items-center gap-3 px-4 py-3 glass-card border ${borders[t.variant]} rounded-2xl max-w-sm shadow-xl`}

// depois:
className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl max-w-sm shadow-xl border ${borders[t.variant]}`}
style={{ background: 'rgba(20,20,20,0.88)', backdropFilter: 'blur(16px)' }}
```

E trocar `text-white/80` → `text-white/90` (toast dark continua com texto branco sobre fundo escuro).

- [ ] **Step 4: Build rápido para verificar que não quebrou**
```bash
npm run build 2>&1 | tail -20
```
Esperado: sem erros de import (pode ter warnings de componentes deletados que ainda são importados — serão resolvidos nas próximas tasks).

- [ ] **Step 5: Commit**
```bash
git add src/index.css src/styles/globals.css src/components/ui/toast.tsx
git commit -m "feat: design tokens — fundo branco, frosted glass, toast dark"
```

---

## Fase 3 — Componentes

### Task 6: VinylDisk — disco animado com album art

**Files:**
- Create: `src/components/vinyl/VinylDisk.tsx`

- [ ] **Step 1: Criar `src/components/vinyl/VinylDisk.tsx`**

```tsx
import { motion } from 'framer-motion'
import vinylWebp from '@/assets/vinyl.webp'

interface VinylDiskProps {
  size?: 'sm' | 'md' | 'lg'
  albumArt?: string
  isPlaying?: boolean
  className?: string
}

const SIZE_MAP = { sm: 180, md: 360, lg: 560 } as const

export function VinylDisk({ size = 'md', albumArt, isPlaying = false, className }: VinylDiskProps) {
  const px = SIZE_MAP[size]
  const labelPx = Math.round(px * 0.27)

  return (
    <div
      className={`relative select-none shrink-0 ${className ?? ''}`}
      style={{ width: px, height: px }}
    >
      <motion.img
        src={vinylWebp}
        alt="vinyl disk"
        draggable={false}
        className="w-full h-full object-cover rounded-full"
        animate={{ rotate: isPlaying ? 360 : 0 }}
        transition={
          isPlaying
            ? { duration: 8, ease: 'linear', repeat: Infinity }
            : { duration: 1.2, ease: 'easeOut' }
        }
      />
      {albumArt && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="rounded-full overflow-hidden border-2 border-white/30"
            style={{ width: labelPx, height: labelPx }}
          >
            <img
              src={albumArt}
              alt="álbum"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verificar que compila**
```bash
npx tsc --noEmit 2>&1 | grep VinylDisk
```
Esperado: sem erros

- [ ] **Step 3: Commit**
```bash
git add src/components/vinyl/VinylDisk.tsx
git commit -m "feat: VinylDisk — disco animado com album art overlay"
```

---

### Task 7: WaveformBars — barras animadas para o MiniPlayer

**Files:**
- Create: `src/components/shared/WaveformBars.tsx`

- [ ] **Step 1: Criar `src/components/shared/WaveformBars.tsx`**

```tsx
import { motion } from 'framer-motion'

const HEIGHTS = [0.45, 0.72, 1.0, 0.58, 0.85, 0.48, 0.9]

export function WaveformBars({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-center gap-[2px]" style={{ height: 20 }}>
      {HEIGHTS.map((h, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-black/60"
          style={{ originY: 'center' }}
          animate={
            isPlaying
              ? { scaleY: [h, h * 0.25, h * 0.8, h * 0.4, h] }
              : { scaleY: 0.2 }
          }
          transition={
            isPlaying
              ? { duration: 0.7 + i * 0.09, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.4 }
          }
          initial={{ scaleY: h }}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add src/components/shared/WaveformBars.tsx
git commit -m "feat: WaveformBars — barras animadas para player"
```

---

### Task 8: ArcCarousel — cards posicionados em arco

**Files:**
- Create: `src/components/vinyl/ArcCarousel.tsx`
- Create: `src/components/vinyl/__tests__/arcAngles.test.ts`

A função de cálculo de ângulos precisa ser testável isoladamente.

- [ ] **Step 1: Escrever teste dos ângulos**

Criar `src/components/vinyl/__tests__/arcAngles.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { calcArcPositions } from '../ArcCarousel'

describe('calcArcPositions', () => {
  it('retorna posições vazias para 0 items', () => {
    expect(calcArcPositions(0, 300, 160, 0)).toHaveLength(0)
  })

  it('item único fica no centro do arco', () => {
    const [pos] = calcArcPositions(1, 300, 160, 0)
    expect(pos.x).toBeCloseTo(0, 0)
    expect(pos.y).toBeLessThan(0) // acima do centro
  })

  it('dois items são simétricos', () => {
    const [a, b] = calcArcPositions(2, 300, 160, 0)
    expect(a.x).toBeCloseTo(-b.x, 1)
    expect(a.y).toBeCloseTo(b.y, 1)
  })

  it('offset desloca todas as posições angularmente', () => {
    const noOffset = calcArcPositions(3, 300, 160, 0)
    const withOffset = calcArcPositions(3, 300, 160, 20)
    expect(withOffset[0].x).not.toBeCloseTo(noOffset[0].x, 1)
  })
})
```

- [ ] **Step 2: Verificar que falha**
```bash
npx vitest run src/components/vinyl/__tests__/arcAngles.test.ts
```
Esperado: FAIL

- [ ] **Step 3: Criar `src/components/vinyl/ArcCarousel.tsx`**

```tsx
import { motion, AnimatePresence } from 'framer-motion'

export interface ArcPosition {
  x: number
  y: number
  tilt: number
}

export function calcArcPositions(
  count: number,
  radius: number,
  arcDeg: number,
  offsetDeg: number
): ArcPosition[] {
  if (count === 0) return []

  const half = arcDeg / 2
  const step = count > 1 ? arcDeg / (count - 1) : 0

  return Array.from({ length: count }, (_, i) => {
    const angleDeg = -half + step * i + offsetDeg
    const rad = (angleDeg * Math.PI) / 180
    return {
      x: Math.sin(rad) * radius,
      y: -Math.cos(rad) * radius,
      tilt: angleDeg * 0.25, // inclinação sutil seguindo arco
    }
  })
}

interface ArcCarouselProps {
  items: React.ReactNode[]
  radius?: number
  arcDeg?: number
  offsetDeg?: number
}

export function ArcCarousel({
  items,
  radius = 300,
  arcDeg = 150,
  offsetDeg = 0,
}: ArcCarouselProps) {
  const positions = calcArcPositions(items.length, radius, arcDeg, offsetDeg)

  return (
    <div className="relative" style={{ width: radius * 2, height: radius + 120 }}>
      <div className="absolute inset-0 flex items-end justify-center">
        <AnimatePresence mode="sync">
          {items.map((item, i) => {
            const pos = positions[i]
            return (
              <motion.div
                key={i}
                className="absolute"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: pos.x,
                  y: pos.y - 60, // offset para ficar acima do ponto base
                }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24, delay: i * 0.04 }}
                style={{ rotate: pos.tilt }}
              >
                {item}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Rodar testes**
```bash
npx vitest run src/components/vinyl/__tests__/arcAngles.test.ts
```
Esperado: PASS

- [ ] **Step 5: Commit**
```bash
git add src/components/vinyl/ArcCarousel.tsx src/components/vinyl/__tests__/arcAngles.test.ts
git commit -m "feat: ArcCarousel — cards em arco com calcArcPositions testável"
```

---

### Task 9: VinylCard — card de música/álbum

**Files:**
- Create: `src/components/shared/VinylCard.tsx`

- [ ] **Step 1: Criar `src/components/shared/VinylCard.tsx`**

```tsx
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SpotifyTrack } from '@/types/spotify'

interface VinylCardProps {
  track: SpotifyTrack
  isActive?: boolean
  isFavorite?: boolean
  onPlay?: (track: SpotifyTrack) => void
  onFavorite?: (track: SpotifyTrack) => void
  size?: 'sm' | 'md'
}

export function VinylCard({
  track,
  isActive = false,
  isFavorite = false,
  onPlay,
  onFavorite,
  size = 'md',
}: VinylCardProps) {
  const dim = size === 'sm' ? 80 : 104

  return (
    <div
      className={cn(
        'glass-card relative cursor-pointer overflow-hidden group',
        isActive && 'ring-2 ring-black/30'
      )}
      style={{ width: dim, height: dim, borderRadius: 14, padding: 0 }}
      onClick={() => onPlay?.(track)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onPlay?.(track)}
      aria-label={`Tocar ${track.name}`}
    >
      <img
        src={track.album.images[0]?.url ?? ''}
        alt={track.album.name}
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex flex-col justify-end p-1.5 opacity-0 group-hover:opacity-100">
        <p className="text-white text-[10px] font-semibold truncate leading-tight">{track.name}</p>
        <p className="text-white/70 text-[9px] truncate">
          {track.artists.map(a => a.name).join(', ')}
        </p>
      </div>

      {/* Heart button */}
      {onFavorite && (
        <button
          className="absolute top-1 right-1 p-1 rounded-full bg-white/70 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          onClick={e => { e.stopPropagation(); onFavorite(track) }}
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart
            size={10}
            className={cn(isFavorite ? 'fill-black text-black' : 'text-black/60')}
          />
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add src/components/shared/VinylCard.tsx
git commit -m "feat: VinylCard — card de música com overlay e botão favorito"
```

---

### Task 10: ArtistCard rebuild

**Files:**
- Modify: `src/components/shared/ArtistCard.tsx`

- [ ] **Step 1: Substituir `src/components/shared/ArtistCard.tsx`**

```tsx
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { SpotifyArtist } from '@/types/spotify'

interface ArtistCardProps {
  artist: SpotifyArtist
}

export function ArtistCard({ artist }: ArtistCardProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const image = artist.images[0]?.url

  return (
    <div
      className="glass-card cursor-pointer overflow-hidden group"
      onClick={() => navigate(`/artists/${artist.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/artists/${artist.id}`)}
      aria-label={`Ver artista ${artist.name}`}
    >
      <div className="aspect-square overflow-hidden bg-black/5">
        {image ? (
          <img
            src={image}
            alt={artist.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-black/20">
            ♪
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-bold text-sm text-black truncate">{artist.name}</p>
        <p className="text-xs text-black/50 mt-0.5">
          {artist.followers.total.toLocaleString()} {t('artists.followers')}
        </p>
        {artist.genres[0] && (
          <p className="text-[11px] text-black/40 mt-0.5 truncate">{artist.genres[0]}</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add src/components/shared/ArtistCard.tsx
git commit -m "feat: ArtistCard rebuild — white bg + glass-card"
```

---

### Task 11: SearchBar + Pagination + TrackRow

**Files:**
- Create: `src/components/shared/SearchBar.tsx`
- Create: `src/components/shared/Pagination.tsx`
- Modify: `src/components/shared/TrackRow.tsx`

- [ ] **Step 1: Criar `src/components/shared/SearchBar.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'

export type SearchTab = 'artista' | 'album' | 'playlist'

interface SearchBarProps {
  onSearch: (query: string, tab: SearchTab) => void
  defaultTab?: SearchTab
  className?: string
}

export function SearchBar({ onSearch, defaultTab = 'artista', className }: SearchBarProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<SearchTab>(defaultTab)
  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    onSearch(debouncedQuery, tab)
  }, [debouncedQuery, tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const tabs: SearchTab[] = ['artista', 'album', 'playlist']

  return (
    <div className={cn('glass flex items-center gap-2 px-4 py-2.5 rounded-full max-w-lg w-full', className)}>
      <Search size={15} className="text-black/40 shrink-0" />
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={t('artists.searchPlaceholder')}
        className="flex-1 bg-transparent text-sm outline-none text-black placeholder:text-black/30 min-w-0"
      />
      <div className="flex gap-1 shrink-0">
        {tabs.map(tabKey => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={cn(
              'text-[11px] px-2.5 py-1 rounded-full transition-colors font-medium',
              tab === tabKey
                ? 'bg-black text-white'
                : 'text-black/40 hover:text-black hover:bg-black/5'
            )}
          >
            {tabKey}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Criar `src/components/shared/Pagination.tsx`**

```tsx
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  className?: string
}

export function Pagination({ page, hasNext, onPrev, onNext, className }: PaginationProps) {
  const { t } = useTranslation()
  return (
    <div className={cn('flex items-center justify-center gap-6 py-4', className)}>
      <button
        onClick={onPrev}
        disabled={page <= 1}
        className="flex items-center gap-1.5 text-sm text-black/50 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} />
        {t('artists.previous')}
      </button>
      <span className="text-sm text-black/30 font-mono">{page}</span>
      <button
        onClick={onNext}
        disabled={!hasNext}
        className="flex items-center gap-1.5 text-sm text-black/50 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        {t('artists.next')}
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Substituir `src/components/shared/TrackRow.tsx`**

```tsx
import { Play } from 'lucide-react'
import { formatDuration } from '@/utils/formatDuration'
import { cn } from '@/lib/utils'
import type { SpotifyTrack } from '@/types/spotify'

interface TrackRowProps {
  track: SpotifyTrack
  index?: number
  isActive?: boolean
  onPlay?: (track: SpotifyTrack) => void
}

export function TrackRow({ track, index, isActive = false, onPlay }: TrackRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-black/5 transition-colors group cursor-pointer',
        isActive && 'bg-black/8'
      )}
      onClick={() => onPlay?.(track)}
      role="row"
    >
      {index !== undefined && (
        <span className="w-6 text-xs text-black/30 text-right shrink-0 group-hover:hidden">
          {index + 1}
        </span>
      )}
      <button
        className={cn(
          'w-6 shrink-0 items-center justify-center hidden group-hover:flex',
          index === undefined && 'flex'
        )}
        aria-label={`Tocar ${track.name}`}
      >
        <Play size={12} className="fill-black text-black" />
      </button>

      <img
        src={track.album.images[0]?.url}
        alt={track.album.name}
        className="w-9 h-9 rounded-lg object-cover shrink-0"
      />

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', isActive ? 'text-black' : 'text-black/80')}>
          {track.name}
        </p>
        <p className="text-xs text-black/40 truncate">
          {track.artists.map(a => a.name).join(', ')}
        </p>
      </div>

      <span className="text-xs text-black/30 shrink-0 ml-2">
        {formatDuration(track.duration_ms)}
      </span>
    </div>
  )
}
```

- [ ] **Step 4: Commit**
```bash
git add src/components/shared/SearchBar.tsx src/components/shared/Pagination.tsx src/components/shared/TrackRow.tsx
git commit -m "feat: SearchBar, Pagination, TrackRow — componentes shared white design"
```

---

## Fase 4 — Layout Shell

### Task 12: HamburgerMenu — overlay deslizante

**Files:**
- Create: `src/components/layout/HamburgerMenu.tsx`

- [ ] **Step 1: Criar `src/components/layout/HamburgerMenu.tsx`**

```tsx
import { AnimatePresence, motion } from 'framer-motion'
import { X, Heart, LogOut, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useUI } from '@/hooks/useUI'
import i18n from '@/lib/i18n'

export function HamburgerMenu() {
  const { state: uiState, dispatch: uiDispatch } = useUI()
  const { state: authState, logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const isOpen = uiState.sidebarOpen
  const open = () => uiDispatch({ type: 'OPEN_SIDEBAR' })
  const close = () => uiDispatch({ type: 'CLOSE_SIDEBAR' })

  const handleNav = (path: string) => {
    close()
    navigate(path)
  }

  const handleLogout = () => {
    close()
    logout()
    navigate('/login')
  }

  const toggleLang = () => {
    const next = i18n.language.startsWith('pt') ? 'en-US' : 'pt-BR'
    i18n.changeLanguage(next)
  }

  const avatar = authState.profile?.images[0]?.url

  return (
    <>
      {/* Hamburger button — fixo top-left */}
      <button
        onClick={open}
        className="fixed top-4 left-4 z-40 p-2 glass rounded-xl hover:bg-black/5 transition-colors"
        aria-label="Abrir menu"
      >
        <Menu size={20} className="text-black/70" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />

            {/* Drawer */}
            <motion.nav
              className="fixed top-0 left-0 bottom-0 z-50 w-72 glass flex flex-col py-8 px-6 gap-6"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {avatar ? (
                    <img src={avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center text-black/40 font-bold">
                      {authState.profile?.display_name?.[0] ?? '?'}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-black truncate max-w-[140px]">
                    {authState.profile?.display_name ?? ''}
                  </span>
                </div>
                <button onClick={close} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
                  <X size={18} className="text-black/50" />
                </button>
              </div>

              <div className="flex flex-col gap-1 flex-1">
                <button
                  onClick={() => handleNav('/favorites')}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 transition-colors text-left"
                >
                  <Heart size={18} className="text-black/50" />
                  <span className="text-sm text-black/70">{t('nav.favorites')}</span>
                </button>

                <button
                  onClick={toggleLang}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 transition-colors text-left"
                >
                  <span className="text-base">🌐</span>
                  <span className="text-sm text-black/70">
                    {i18n.language.startsWith('pt') ? 'PT → EN' : 'EN → PT'}
                  </span>
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-left"
              >
                <LogOut size={18} className="text-red-400" />
                <span className="text-sm text-red-400">{t('nav.logout')}</span>
              </button>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
```

- [ ] **Step 2: Verificar que UIContext tem OPEN_SIDEBAR / CLOSE_SIDEBAR**
```bash
grep -n "OPEN_SIDEBAR\|CLOSE_SIDEBAR\|sidebarOpen" src/contexts/uiReducer.ts
```
Se não existir, adicionar em `src/contexts/uiReducer.ts`:
```typescript
// Adicionar ao UIState:
sidebarOpen: boolean

// Adicionar ao initialUIState:
sidebarOpen: false,

// Adicionar ao uiReducer switch:
case 'OPEN_SIDEBAR': return { ...state, sidebarOpen: true }
case 'CLOSE_SIDEBAR': return { ...state, sidebarOpen: false }
```
E à união de UIAction:
```typescript
| { type: 'OPEN_SIDEBAR' }
| { type: 'CLOSE_SIDEBAR' }
```

- [ ] **Step 3: Commit**
```bash
git add src/components/layout/HamburgerMenu.tsx src/contexts/uiReducer.ts
git commit -m "feat: HamburgerMenu — overlay deslizante frosted glass"
```

---

### Task 13: MiniPlayer rebuild — design wireframe

**Files:**
- Modify: `src/components/layout/MiniPlayer.tsx`

- [ ] **Step 1: Substituir `src/components/layout/MiniPlayer.tsx`**

```tsx
import { useCallback } from 'react'
import {
  SkipBack, Play, Pause, SkipForward,
  Shuffle, Repeat, Repeat1, Heart, ListMusic, Search,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePlayer } from '@/hooks/usePlayer'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { useToast } from '@/components/ui/toast'
import { useTranslation } from 'react-i18next'
import { WaveformBars } from '@/components/shared/WaveformBars'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'
import type { AxiosError } from 'axios'

export function MiniPlayer() {
  const { state, dispatch } = usePlayer()
  const { currentTrack, isPlaying, shuffle, repeat } = state
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { t } = useTranslation()
  const playTrack = usePlayTrack()

  // Oculto na rota /player
  if (location.pathname === '/player') return null

  const handlePlayPause = useCallback(async () => {
    const next = !isPlaying
    dispatch({ type: 'SET_PLAYING', payload: next })
    try {
      await api.put(next ? '/me/player/play' : '/me/player/pause')
    } catch (err) {
      dispatch({ type: 'SET_PLAYING', payload: isPlaying }) // revert
      const status = (err as AxiosError).response?.status
      if (status === 404 || status === 403) toast(t('player.noActiveDevice'), 'info')
    }
  }, [dispatch, isPlaying, toast, t])

  const handlePrev = useCallback(async () => {
    try { await api.post('/me/player/previous') } catch { /* silent */ }
  }, [])

  const handleNext = useCallback(async () => {
    dispatch({ type: 'SET_PROGRESS', payload: 0 })
    try { await api.post('/me/player/next') } catch { /* silent */ }
  }, [dispatch])

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
    <div className="fixed bottom-0 left-0 right-0 z-30 glass border-t border-white/40 px-4 py-3 flex items-center gap-3">
      {/* Busca */}
      <button
        onClick={() => navigate('/artists')}
        className="p-2 rounded-xl hover:bg-black/5 transition-colors shrink-0"
        aria-label="Buscar artistas"
      >
        <Search size={18} className="text-black/40" />
      </button>

      {/* Track info + waveform */}
      <div
        className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer group"
        onClick={() => currentTrack && navigate('/player')}
      >
        {currentTrack ? (
          <>
            <img
              src={currentTrack.album.images[0]?.url}
              alt={currentTrack.album.name}
              className="w-9 h-9 rounded-lg object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-black truncate group-hover:underline">
                {currentTrack.name}
              </p>
              <p className="text-[11px] text-black/50 truncate">
                {currentTrack.artists.map(a => a.name).join(', ')}
              </p>
            </div>
            <WaveformBars isPlaying={isPlaying} />
          </>
        ) : (
          <p className="text-xs text-black/30">{t('player.noTrack')}</p>
        )}
      </div>

      {/* Controles */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={toggleShuffle}
          className={cn('p-1.5 rounded-lg transition-colors', shuffle ? 'text-black' : 'text-black/30 hover:text-black/60')}
        >
          <Shuffle size={15} />
        </button>
        <button onClick={handlePrev} className="p-1.5 rounded-lg text-black/60 hover:text-black transition-colors">
          <SkipBack size={18} className="fill-current" />
        </button>
        <button
          onClick={handlePlayPause}
          className="w-9 h-9 rounded-full bg-black flex items-center justify-center hover:bg-black/80 transition-colors"
        >
          {isPlaying
            ? <Pause size={14} className="fill-white text-white" />
            : <Play size={14} className="fill-white text-white ml-0.5" />}
        </button>
        <button onClick={handleNext} className="p-1.5 rounded-lg text-black/60 hover:text-black transition-colors">
          <SkipForward size={18} className="fill-current" />
        </button>
        <button
          onClick={cycleRepeat}
          className={cn('p-1.5 rounded-lg transition-colors', repeat !== 'off' ? 'text-black' : 'text-black/30 hover:text-black/60')}
        >
          {repeat === 'track' ? <Repeat1 size={15} /> : <Repeat size={15} />}
        </button>
        <button
          onClick={() => navigate('/player')}
          className="p-1.5 rounded-lg text-black/30 hover:text-black transition-colors"
          aria-label={t('player.queue')}
        >
          <ListMusic size={15} />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add src/components/layout/MiniPlayer.tsx
git commit -m "feat: MiniPlayer rebuild — design wireframe, frosted glass, waveform"
```

---

### Task 14: PlayerView — tela /player com lyrics + queue

**Files:**
- Create: `src/components/layout/PlayerView.tsx`

- [ ] **Step 1: Criar `src/components/layout/PlayerView.tsx`**

```tsx
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, SkipBack, Play, Pause, SkipForward, ListMusic, Music, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePlayer } from '@/hooks/usePlayer'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { useLyrics } from '@/hooks/queries/useLyrics'
import { useToast } from '@/components/ui/toast'
import { formatDuration } from '@/utils/formatDuration'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'
import type { AxiosError } from 'axios'

export function PlayerView() {
  const { state, dispatch } = usePlayer()
  const { currentTrack, isPlaying, progress, duration, queue } = state
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { toast } = useToast()
  const playTrack = usePlayTrack()
  const [panel, setPanel] = useState<'lyrics' | 'queue' | null>(null)

  const artistName = currentTrack?.artists[0]?.name ?? ''
  const trackName = currentTrack?.name ?? ''
  const lyrics = useLyrics(artistName, trackName, panel === 'lyrics')

  const handlePlayPause = useCallback(async () => {
    const next = !isPlaying
    dispatch({ type: 'SET_PLAYING', payload: next })
    try {
      await api.put(next ? '/me/player/play' : '/me/player/pause')
    } catch (err) {
      dispatch({ type: 'SET_PLAYING', payload: isPlaying })
      const status = (err as AxiosError).response?.status
      if (status === 404 || status === 403) toast(t('player.noActiveDevice'), 'info')
    }
  }, [dispatch, isPlaying, toast, t])

  const handlePrev = useCallback(async () => {
    try { await api.post('/me/player/previous') } catch { /* silent */ }
  }, [])

  const handleNext = useCallback(async () => {
    dispatch({ type: 'SET_PROGRESS', payload: 0 })
    try { await api.post('/me/player/next') } catch { /* silent */ }
  }, [dispatch])

  const handleSeek = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const ms = Number(e.target.value)
    dispatch({ type: 'SET_PROGRESS', payload: ms })
    try { await api.put('/me/player/seek', null, { params: { position_ms: ms } }) } catch { /* silent */ }
  }, [dispatch])

  const handleQueuePlay = useCallback((index: number) => {
    const track = queue[index]
    if (track) playTrack(track, queue.slice(index + 1))
  }, [playTrack, queue])

  const albumArt = currentTrack?.album.images[0]?.url

  return (
    <div className="relative min-h-screen bg-black overflow-hidden flex flex-col">
      {/* Background blur */}
      {albumArt && (
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url(${albumArt})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(60px)',
            transform: 'scale(1.1)',
          }}
        />
      )}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative flex flex-col flex-1 p-6 gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl glass"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <p className="text-xs text-white/40 uppercase tracking-widest">{t('lyrics.nowPlaying')}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPanel(p => p === 'queue' ? null : 'queue')}
              className={cn('p-2 rounded-xl glass', panel === 'queue' && 'bg-white/20')}
            >
              <ListMusic size={18} className="text-white" />
            </button>
            <button
              onClick={() => setPanel(p => p === 'lyrics' ? null : 'lyrics')}
              className={cn('p-2 rounded-xl glass', panel === 'lyrics' && 'bg-white/20')}
            >
              <Music size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* Main */}
        <div className="flex flex-1 gap-6 overflow-hidden">
          {/* Album art + info */}
          <div className="flex flex-col items-center justify-center gap-6 flex-1">
            {albumArt && (
              <motion.img
                key={currentTrack?.id}
                src={albumArt}
                alt={currentTrack?.album.name}
                className="w-64 h-64 rounded-2xl object-cover shadow-2xl"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              />
            )}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">{currentTrack?.name}</h2>
              <p className="text-white/60 mt-1">
                {currentTrack?.artists.map(a => a.name).join(', ')}
              </p>
            </div>
          </div>

          {/* Side panel */}
          <AnimatePresence mode="wait">
            {panel && (
              <motion.div
                key={panel}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.2 }}
                className="w-80 glass-card flex flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                  <p className="text-sm font-bold text-white">
                    {panel === 'lyrics' ? t('player.lyrics') : t('player.queue')}
                  </p>
                  <button onClick={() => setPanel(null)}>
                    <X size={16} className="text-white/50" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-3">
                  {panel === 'lyrics' && (
                    lyrics.isPending ? (
                      <p className="text-white/30 text-sm p-4">{t('lyrics.searching')}</p>
                    ) : lyrics.data ? (
                      <pre className="font-sans text-sm text-white/80 leading-relaxed whitespace-pre-wrap p-2">
                        {lyrics.data}
                      </pre>
                    ) : (
                      <p className="text-white/30 text-sm p-4">{t('lyrics.notFound')}</p>
                    )
                  )}

                  {panel === 'queue' && (
                    queue.length === 0 ? (
                      <p className="text-white/30 text-sm p-4">{t('player.noTrack')}</p>
                    ) : (
                      <div className="space-y-1">
                        {queue.map((track, i) => (
                          <button
                            key={`${track.id}-${i}`}
                            onClick={() => handleQueuePlay(i)}
                            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-left"
                          >
                            <span className="text-xs text-white/30 w-4 shrink-0">{i + 1}</span>
                            <img
                              src={track.album.images[0]?.url}
                              className="w-9 h-9 rounded-lg object-cover shrink-0"
                              alt={track.album.name}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-white truncate">{track.name}</p>
                              <p className="text-xs text-white/40 truncate">
                                {track.artists.map(a => a.name).join(', ')}
                              </p>
                            </div>
                            <span className="text-xs text-white/30 shrink-0">
                              {formatDuration(track.duration_ms)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 w-full max-w-md">
            <span className="text-xs text-white/40 w-10 text-right">{formatDuration(progress)}</span>
            <input
              type="range" min={0} max={duration || 1} value={progress}
              onChange={handleSeek}
              className="flex-1 h-1.5 appearance-none bg-white/20 rounded-full accent-white cursor-pointer"
            />
            <span className="text-xs text-white/40 w-10">{formatDuration(duration)}</span>
          </div>
          <div className="flex items-center gap-6">
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
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add src/components/layout/PlayerView.tsx
git commit -m "feat: PlayerView — tela /player com lyrics, queue, controles"
```

---

### Task 15: AppShell rebuild + Router

**Files:**
- Modify: `src/components/layout/AppShell.tsx`
- Modify: `src/router.tsx`

- [ ] **Step 1: Substituir `src/components/layout/AppShell.tsx`**

```tsx
import { Outlet } from 'react-router-dom'
import { HamburgerMenu } from './HamburgerMenu'
import { MiniPlayer } from './MiniPlayer'
import { PlayerSync } from './PlayerSync'
import { QueryErrorHandler } from './QueryErrorHandler'

export function AppShell() {
  return (
    <>
      <PlayerSync />
      <QueryErrorHandler />
      <HamburgerMenu />
      <main className="min-h-screen bg-white pb-20">
        <Outlet />
      </main>
      <MiniPlayer />
    </>
  )
}
```

- [ ] **Step 2: Substituir `src/router.tsx`**

```tsx
import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { PlayerView } from '@/components/layout/PlayerView'
import { Login } from '@/pages/Login'
import { OAuthCallback } from '@/pages/OAuthCallback'
import { Home } from '@/pages/Home'
import { Artists } from '@/pages/Artists'
import { ArtistDetail } from '@/pages/ArtistDetail'
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
      { path: 'favorites', element: <Favorites /> },
      { path: 'profile', element: <Profile /> },
    ],
  },
])
```

- [ ] **Step 3: Commit**
```bash
git add src/components/layout/AppShell.tsx src/router.tsx
git commit -m "feat: AppShell simplificado + router com rota /player separada"
```

---

## Fase 5 — Páginas

### Task 16: Login — vinyl + animação de entrada

**Files:**
- Modify: `src/pages/Login.tsx`

- [ ] **Step 1: Substituir `src/pages/Login.tsx`**

```tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useAnimationControls } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { VinylDisk } from '@/components/vinyl/VinylDisk'

export function Login() {
  const { t } = useTranslation()
  const { login, state } = useAuth()
  const navigate = useNavigate()
  const controls = useAnimationControls()

  useEffect(() => {
    if (state.isAuthenticated) navigate('/')
  }, [state.isAuthenticated, navigate])

  const handleLogin = async () => {
    await controls.start({
      y: '-110vh',
      transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
    })
    await login()
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-10 overflow-hidden">
      <motion.h1
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="text-6xl font-black tracking-tighter text-black"
      >
        Spoter
      </motion.h1>

      <motion.div
        animate={controls}
        initial={{ y: 80, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <VinylDisk size="lg" isPlaying={false} />
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        onClick={handleLogin}
        className="px-10 py-3.5 bg-[#1DB954] text-black font-bold text-sm rounded-full hover:bg-[#1ed760] transition-colors shadow-lg shadow-[#1DB954]/20"
      >
        {t('login.button')}
      </motion.button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add src/pages/Login.tsx
git commit -m "feat: Login — disco de vinil animado, transição de saída"
```

---

### Task 17: Home — ArcCarousel com músicas recentes

**Files:**
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Substituir `src/pages/Home.tsx`**

```tsx
import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRecentlyPlayed } from '@/hooks/queries/useRecentlyPlayed'
import { usePlayer } from '@/hooks/usePlayer'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { VinylDisk } from '@/components/vinyl/VinylDisk'
import { ArcCarousel } from '@/components/vinyl/ArcCarousel'
import { VinylCard } from '@/components/shared/VinylCard'
import { SearchBar } from '@/components/shared/SearchBar'
import type { SearchTab } from '@/components/shared/SearchBar'
import type { SpotifyTrack } from '@/types/spotify'

export function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state } = usePlayer()
  const playTrack = usePlayTrack()
  const recentlyPlayed = useRecentlyPlayed(10)
  const [offsetDeg, setOffsetDeg] = useState(0)

  const tracks: SpotifyTrack[] = recentlyPlayed.data?.map(i => i.track) ?? []

  const handleSearch = useCallback((query: string, tab: SearchTab) => {
    if (query.trim()) navigate(`/artists?q=${encodeURIComponent(query)}&tab=${tab}`)
  }, [navigate])

  const albumArt = state.currentTrack?.album.images[0]?.url

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* SearchBar */}
      <div className="fixed top-14 left-0 right-0 z-20 flex justify-center px-4 pt-2">
        <SearchBar onSearch={handleSearch} className="shadow-sm" />
      </div>

      {/* Title */}
      <div className="pt-36 text-center px-4">
        <h2 className="text-lg font-bold text-black/60">{t('home.recentlyPlayed')}</h2>
      </div>

      {/* Vinyl + Arc Carousel */}
      <div className="relative flex justify-center mt-4" style={{ height: 580 }}>
        {/* Vinyl disk — base */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-[-20px]">
          <VinylDisk size="lg" isPlaying={state.isPlaying} albumArt={albumArt} />
        </div>

        {/* Arc Carousel — centered on vinyl disk */}
        <div className="absolute bottom-[260px] left-1/2 -translate-x-1/2">
          {tracks.length > 0 && (
            <ArcCarousel
              items={tracks.map(track => (
                <VinylCard
                  key={track.id}
                  track={track}
                  isActive={state.currentTrack?.id === track.id}
                  onPlay={playTrack}
                  size="md"
                />
              ))}
              radius={280}
              arcDeg={140}
              offsetDeg={offsetDeg}
            />
          )}
        </div>

        {/* Navigation arrows */}
        <button
          onClick={() => setOffsetDeg(o => o - 18)}
          className="absolute left-6 top-1/2 -translate-y-1/2 glass rounded-full p-2.5 hover:bg-black/5 transition-colors"
          aria-label="Anterior"
        >
          <ChevronLeft size={20} className="text-black/60" />
        </button>
        <button
          onClick={() => setOffsetDeg(o => o + 18)}
          className="absolute right-6 top-1/2 -translate-y-1/2 glass rounded-full p-2.5 hover:bg-black/5 transition-colors"
          aria-label="Próximo"
        >
          <ChevronRight size={20} className="text-black/60" />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add src/pages/Home.tsx
git commit -m "feat: Home — ArcCarousel com músicas recentes ao redor do vinil"
```

---

### Task 18: Artists — grid paginado com filtro

**Files:**
- Modify: `src/pages/Artists.tsx`

- [ ] **Step 1: Substituir `src/pages/Artists.tsx`**

```tsx
import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useArtists } from '@/hooks/queries/useArtists'
import { useSearchAlbums } from '@/hooks/queries/useSearchAlbums'
import { ArtistCard } from '@/components/shared/ArtistCard'
import { SearchBar } from '@/components/shared/SearchBar'
import { Pagination } from '@/components/shared/Pagination'
import type { SearchTab } from '@/components/shared/SearchBar'

export function Artists() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialQuery = searchParams.get('q') ?? ''
  const initialTab = (searchParams.get('tab') as SearchTab) ?? 'artista'

  const [query, setQuery] = useState(initialQuery)
  const [tab, setTab] = useState<SearchTab>(initialTab)
  const [page, setPage] = useState(1)

  const artists = useArtists(tab === 'artista' ? query : '', page)
  const albums = useSearchAlbums(tab === 'album' ? query : '', page)

  const isArtist = tab === 'artista'
  const data = isArtist ? artists.data : albums.data
  const isLoading = isArtist ? artists.isPending : albums.isPending
  const hasNext = data ? (data.offset + data.limit) < data.total : false

  const handleSearch = useCallback((q: string, t: SearchTab) => {
    setQuery(q)
    setTab(t)
    setPage(1)
    setSearchParams({ q, tab: t })
  }, [setSearchParams])

  useEffect(() => {
    setPage(1)
  }, [query, tab])

  return (
    <div className="min-h-screen bg-white">
      {/* SearchBar */}
      <div className="fixed top-14 left-0 right-0 z-20 flex justify-center px-4 pt-2">
        <SearchBar onSearch={handleSearch} defaultTab={tab} className="shadow-sm" />
      </div>

      <div className="pt-36 px-6 pb-24">
        {/* Results header */}
        {query && (
          <p className="text-sm text-black/40 mb-4">
            {isArtist ? t('artists.searchArtists') : t('artists.searchAlbums')}
            {data && ` — ${data.total} resultados`}
          </p>
        )}

        {/* Empty state */}
        {!query && (
          <p className="text-center text-black/30 mt-20">{t('artists.searchPrompt')}</p>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card aspect-square animate-pulse" />
            ))}
          </div>
        )}

        {/* Artist grid */}
        {!isLoading && isArtist && artists.data && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {artists.data.items.map(artist => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        )}

        {/* Album grid */}
        {!isLoading && !isArtist && albums.data && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {albums.data.items.map(album => (
              <div key={album.id} className="glass-card overflow-hidden cursor-pointer group">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={album.images[0]?.url}
                    alt={album.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-black truncate">{album.name}</p>
                  <p className="text-xs text-black/50 truncate">
                    {album.artists.map(a => a.name).join(', ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {!isLoading && query && data?.items.length === 0 && (
          <p className="text-center text-black/30 mt-20">{t('artists.noResults')}</p>
        )}

        {/* Pagination */}
        {data && data.items.length > 0 && (
          <Pagination
            page={page}
            hasNext={hasNext}
            onPrev={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => p + 1)}
            className="mt-8"
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add src/pages/Artists.tsx
git commit -m "feat: Artists — grid 4col, 20/pág, filtro artista/álbum"
```

---

### Task 19: ArtistDetail — arc top tracks + tabela + chart

**Files:**
- Modify: `src/pages/ArtistDetail.tsx`

- [ ] **Step 1: Substituir `src/pages/ArtistDetail.tsx`**

```tsx
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { useArtist } from '@/hooks/queries/useArtist'
import { useArtistTopTracks } from '@/hooks/queries/useArtistTopTracks'
import { useArtistAlbums } from '@/hooks/queries/useArtistAlbums'
import { useAudioFeatures } from '@/hooks/queries/useAudioFeatures'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { ArcCarousel } from '@/components/vinyl/ArcCarousel'
import { VinylCard } from '@/components/shared/VinylCard'
import { TrackRow } from '@/components/shared/TrackRow'
import { Pagination } from '@/components/shared/Pagination'
import { usePlayer } from '@/hooks/usePlayer'

export function ArtistDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { state } = usePlayer()
  const playTrack = usePlayTrack()
  const [albumPage, setAlbumPage] = useState(1)

  const artist = useArtist(id)
  const topTracks = useArtistTopTracks(id)
  const albums = useArtistAlbums(id, albumPage, 10)

  const topIds = topTracks.data?.slice(0, 5).map(t => t.id) ?? []
  const audioFeatures = useAudioFeatures(topIds)

  const radarData = audioFeatures.data
    ? [
        { subject: 'Dança', A: Math.round((audioFeatures.data[0]?.danceability ?? 0) * 100) },
        { subject: 'Energia', A: Math.round((audioFeatures.data[0]?.energy ?? 0) * 100) },
        { subject: 'Valência', A: Math.round((audioFeatures.data[0]?.valence ?? 0) * 100) },
        { subject: 'Acústica', A: Math.round((audioFeatures.data[0]?.acousticness ?? 0) * 100) },
        { subject: 'Ao Vivo', A: Math.round((audioFeatures.data[0]?.liveness ?? 0) * 100) },
      ]
    : []

  const hasNextAlbums = albums.data
    ? (albums.data.offset + albums.data.limit) < albums.data.total
    : false

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Artist hero */}
      <div className="relative h-64 overflow-hidden">
        {artist.data?.images[0]?.url && (
          <img
            src={artist.data.images[0].url}
            alt={artist.data.name}
            className="w-full h-full object-cover object-top"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
        <div className="absolute bottom-4 left-6">
          <h1 className="text-4xl font-black text-black">{artist.data?.name}</h1>
          <p className="text-sm text-black/50 mt-1">
            {artist.data?.followers.total.toLocaleString()} {t('artists.followers')}
          </p>
        </div>
      </div>

      {/* Top Tracks Arc */}
      <div className="px-6 pt-4">
        <h2 className="text-base font-bold text-black/60 mb-2 text-center">{t('artistDetail.topTracks')}</h2>

        {topTracks.data && topTracks.data.length > 0 && (
          <div className="flex justify-center">
            <ArcCarousel
              items={topTracks.data.slice(0, 5).map((track, i) => (
                <div key={track.id} className="flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-black/40">{String(i + 1).padStart(2, '0')}</span>
                  <VinylCard
                    track={track}
                    isActive={state.currentTrack?.id === track.id}
                    onPlay={playTrack}
                    size="md"
                  />
                </div>
              ))}
              radius={220}
              arcDeg={120}
            />
          </div>
        )}
      </div>

      {/* Mais ouvidas label */}
      <p className="text-center text-sm font-medium text-black/40 mt-2 mb-6">
        {t('artistDetail.topTracks')}
      </p>

      {/* Full top tracks list */}
      <div className="px-4 mb-8">
        {topTracks.data?.map((track, i) => (
          <TrackRow
            key={track.id}
            track={track}
            index={i}
            isActive={state.currentTrack?.id === track.id}
            onPlay={playTrack}
          />
        ))}
      </div>

      {/* Charts + Albums */}
      <div className="px-6 flex flex-col lg:flex-row gap-8">
        {/* Radar chart */}
        {radarData.length > 0 && (
          <div className="glass-card p-5 lg:w-80 shrink-0">
            <p className="text-sm font-bold text-black mb-3">
              {t('artistDetail.audioProfile')}
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(0,0,0,0.1)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: 'rgba(0,0,0,0.5)', fontSize: 11 }}
                />
                <Radar
                  dataKey="A"
                  stroke="#111"
                  fill="#111"
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Albums table */}
        <div className="flex-1">
          <h3 className="text-sm font-bold text-black/60 mb-3">{t('artistDetail.albums')}</h3>
          <div className="space-y-2">
            {albums.data?.items.map(album => (
              <div key={album.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 transition-colors">
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
          </div>
          <Pagination
            page={albumPage}
            hasNext={hasNextAlbums}
            onPrev={() => setAlbumPage(p => Math.max(1, p - 1))}
            onNext={() => setAlbumPage(p => p + 1)}
            className="mt-4"
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Adicionar key `artistDetail.audioProfile` aos locales**

Em `src/locales/pt-BR.json`, no objeto `artistDetail`:
```json
"audioProfile": "Perfil de Áudio"
```
Em `src/locales/en-US.json`:
```json
"audioProfile": "Audio Profile"
```

- [ ] **Step 3: Commit**
```bash
git add src/pages/ArtistDetail.tsx src/locales/pt-BR.json src/locales/en-US.json
git commit -m "feat: ArtistDetail — arc top tracks, tabela álbuns paginada, radar chart"
```

---

## Fase 6 — Integração Playlist Spotify

### Task 20: Tipos Spotify para playlist + search tracks

**Files:**
- Modify: `src/types/spotify.ts`

- [ ] **Step 1: Adicionar ao final de `src/types/spotify.ts`**

```typescript
export interface SpotifyPlaylist {
  id: string
  name: string
  description: string | null
  images: SpotifyImage[]
  owner: { id: string; display_name: string }
  tracks: { total: number; href: string }
  uri: string
  public: boolean | null
}

export interface SpotifyPlaylistTrack {
  added_at: string
  track: SpotifyTrack
}

export interface UserPlaylistsResponse {
  items: SpotifyPlaylist[]
  total: number
  limit: number
  offset: number
  next: string | null
}

export interface PlaylistTracksResponse {
  items: SpotifyPlaylistTrack[]
  total: number
  limit: number
  offset: number
  next: string | null
}

export interface SearchTracksResponse {
  tracks: PagingObject<SpotifyTrack>
}
```

- [ ] **Step 2: Commit**
```bash
git add src/types/spotify.ts
git commit -m "feat: tipos Spotify — Playlist, PlaylistTrack, SearchTracks"
```

---

### Task 21: Hooks de query para playlist + search tracks

**Files:**
- Create: `src/hooks/queries/useUserPlaylists.ts`
- Create: `src/hooks/queries/usePlaylistTracks.ts`
- Create: `src/hooks/queries/useSearchTracks.ts`

- [ ] **Step 1: Criar `src/hooks/queries/useUserPlaylists.ts`**

```typescript
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { UserPlaylistsResponse } from '@/types/spotify'

export function useUserPlaylists(enabled = true) {
  return useQuery<UserPlaylistsResponse>({
    queryKey: ['user-playlists'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<UserPlaylistsResponse>('/me/playlists', {
        params: { limit: 50 },
      })
      return data
    },
  })
}
```

- [ ] **Step 2: Criar `src/hooks/queries/usePlaylistTracks.ts`**

```typescript
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { PlaylistTracksResponse } from '@/types/spotify'

export function usePlaylistTracks(playlistId: string, enabled = true) {
  return useQuery<PlaylistTracksResponse>({
    queryKey: ['playlist-tracks', playlistId],
    enabled: enabled && playlistId.length > 0,
    queryFn: async () => {
      const { data } = await api.get<PlaylistTracksResponse>(
        `/playlists/${playlistId}/tracks`,
        { params: { limit: 50 } }
      )
      return data
    },
  })
}
```

- [ ] **Step 3: Criar `src/hooks/queries/useSearchTracks.ts`**

```typescript
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SearchTracksResponse, SpotifyTrack } from '@/types/spotify'

export function useSearchTracks(query: string, enabled = true) {
  return useQuery<SpotifyTrack[]>({
    queryKey: ['search-tracks', query],
    enabled: enabled && query.trim().length > 0,
    queryFn: async () => {
      const { data } = await api.get<SearchTracksResponse>('/search', {
        params: { q: query, type: 'track', limit: 5 },
      })
      return data.tracks.items
    },
  })
}
```

- [ ] **Step 4: Commit**
```bash
git add src/hooks/queries/useUserPlaylists.ts src/hooks/queries/usePlaylistTracks.ts src/hooks/queries/useSearchTracks.ts
git commit -m "feat: hooks de query — useUserPlaylists, usePlaylistTracks, useSearchTracks"
```

---

### Task 22: Mutations para criação e edição de playlist

**Files:**
- Create: `src/hooks/mutations/useCreatePlaylist.ts`
- Create: `src/hooks/mutations/useAddToPlaylist.ts`
- Create: `src/hooks/mutations/useRemoveFromPlaylist.ts`

- [ ] **Step 1: Criar `src/hooks/mutations/useCreatePlaylist.ts`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SpotifyPlaylist } from '@/types/spotify'

interface CreatePlaylistVars {
  userId: string
  name: string
  isPublic?: boolean
  description?: string
}

export function useCreatePlaylist() {
  const qc = useQueryClient()
  return useMutation<SpotifyPlaylist, Error, CreatePlaylistVars>({
    mutationFn: async ({ userId, name, isPublic = false, description = '' }) => {
      const { data } = await api.post<SpotifyPlaylist>(`/users/${userId}/playlists`, {
        name,
        public: isPublic,
        description,
      })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-playlists'] })
    },
  })
}
```

- [ ] **Step 2: Criar `src/hooks/mutations/useAddToPlaylist.ts`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

interface AddVars { playlistId: string; uris: string[] }

export function useAddToPlaylist() {
  const qc = useQueryClient()
  return useMutation<void, Error, AddVars>({
    mutationFn: async ({ playlistId, uris }) => {
      await api.post(`/playlists/${playlistId}/tracks`, { uris })
    },
    onSuccess: (_data, { playlistId }) => {
      qc.invalidateQueries({ queryKey: ['playlist-tracks', playlistId] })
    },
  })
}
```

- [ ] **Step 3: Criar `src/hooks/mutations/useRemoveFromPlaylist.ts`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

interface RemoveVars { playlistId: string; uris: string[] }

export function useRemoveFromPlaylist() {
  const qc = useQueryClient()
  return useMutation<void, Error, RemoveVars>({
    mutationFn: async ({ playlistId, uris }) => {
      await api.delete(`/playlists/${playlistId}/tracks`, {
        data: { tracks: uris.map(uri => ({ uri })) },
      })
    },
    onSuccess: (_data, { playlistId }) => {
      qc.invalidateQueries({ queryKey: ['playlist-tracks', playlistId] })
    },
  })
}
```

- [ ] **Step 4: Commit**
```bash
git add src/hooks/mutations/
git commit -m "feat: mutations — useCreatePlaylist, useAddToPlaylist, useRemoveFromPlaylist"
```

---

### Task 23: useSpoterPlaylist — hook de composição

**Files:**
- Create: `src/hooks/useSpoterPlaylist.ts`
- Test: `src/hooks/__tests__/useSpoterPlaylist.test.ts`

- [ ] **Step 1: Escrever teste**

Criar `src/hooks/__tests__/useSpoterPlaylist.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/hooks/queries/useUserPlaylists', () => ({
  useUserPlaylists: () => ({
    data: {
      items: [{ id: 'pl-123', name: 'Spoter List' }],
    },
  }),
}))
vi.mock('@/hooks/queries/usePlaylistTracks', () => ({
  usePlaylistTracks: () => ({ data: { items: [] } }),
}))
vi.mock('@/hooks/mutations/useCreatePlaylist', () => ({
  useCreatePlaylist: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/mutations/useAddToPlaylist', () => ({
  useAddToPlaylist: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/mutations/useRemoveFromPlaylist', () => ({
  useRemoveFromPlaylist: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ state: { profile: { id: 'user-1' } } }),
}))

import { renderHook } from '@testing-library/react'
import { useSpoterPlaylist } from '@/hooks/useSpoterPlaylist'

describe('useSpoterPlaylist', () => {
  it('encontra a playlist "Spoter List" existente e salva o id', () => {
    const { result } = renderHook(() => useSpoterPlaylist())
    expect(result.current.playlistId).toBe('pl-123')
  })

  it('expõe lista de tracks (vazia aqui)', () => {
    const { result } = renderHook(() => useSpoterPlaylist())
    expect(result.current.tracks).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Verificar que falha**
```bash
npx vitest run src/hooks/__tests__/useSpoterPlaylist.test.ts
```

- [ ] **Step 3: Criar `src/hooks/useSpoterPlaylist.ts`**

```typescript
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useUserPlaylists } from '@/hooks/queries/useUserPlaylists'
import { usePlaylistTracks } from '@/hooks/queries/usePlaylistTracks'
import { useCreatePlaylist } from '@/hooks/mutations/useCreatePlaylist'
import { useAddToPlaylist } from '@/hooks/mutations/useAddToPlaylist'
import { useRemoveFromPlaylist } from '@/hooks/mutations/useRemoveFromPlaylist'

const STORAGE_KEY = 'spoter_playlist_id'
const PLAYLIST_NAME = 'Spoter List'

export function useSpoterPlaylist() {
  const { state: authState } = useAuth()
  const userId = authState.profile?.id ?? ''

  const [playlistId, setPlaylistId] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? ''
  )

  const playlists = useUserPlaylists(!!userId)
  const createPlaylist = useCreatePlaylist()
  const addMutation = useAddToPlaylist()
  const removeMutation = useRemoveFromPlaylist()
  const tracks = usePlaylistTracks(playlistId)

  useEffect(() => {
    if (!playlists.data || playlistId) return

    const existing = playlists.data.items.find(p => p.name === PLAYLIST_NAME)
    if (existing) {
      setPlaylistId(existing.id)
      localStorage.setItem(STORAGE_KEY, existing.id)
    } else if (userId) {
      createPlaylist.mutate(
        { userId, name: PLAYLIST_NAME, isPublic: false },
        {
          onSuccess: playlist => {
            setPlaylistId(playlist.id)
            localStorage.setItem(STORAGE_KEY, playlist.id)
          },
        }
      )
    }
  }, [playlists.data, playlistId, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const addTrack = (uri: string) => {
    if (playlistId) addMutation.mutate({ playlistId, uris: [uri] })
  }

  const removeTrack = (uri: string) => {
    if (playlistId) removeMutation.mutate({ playlistId, uris: [uri] })
  }

  return {
    playlistId,
    tracks: tracks.data?.items.map(i => i.track) ?? [],
    addTrack,
    removeTrack,
    isLoading: !playlistId || !tracks.data,
  }
}
```

- [ ] **Step 4: Rodar testes**
```bash
npx vitest run src/hooks/__tests__/useSpoterPlaylist.test.ts
```
Esperado: PASS

- [ ] **Step 5: Commit**
```bash
git add src/hooks/useSpoterPlaylist.ts src/hooks/__tests__/useSpoterPlaylist.test.ts
git commit -m "feat: useSpoterPlaylist — encontra/cria Spoter List, expõe addTrack/removeTrack"
```

---

### Task 24: Favorites — Spoter List + form de busca

**Files:**
- Modify: `src/pages/Favorites.tsx`

- [ ] **Step 1: Substituir `src/pages/Favorites.tsx`**

```tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, Plus, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSpoterPlaylist } from '@/hooks/useSpoterPlaylist'
import { useSearchTracks } from '@/hooks/queries/useSearchTracks'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { TrackRow } from '@/components/shared/TrackRow'
import type { SpotifyTrack } from '@/types/spotify'

const SearchSchema = z.object({
  query: z.string().min(2, 'Digite pelo menos 2 caracteres'),
})
type SearchForm = z.infer<typeof SearchSchema>

export function Favorites() {
  const { t } = useTranslation()
  const { tracks, addTrack, removeTrack, isLoading } = useSpoterPlaylist()
  const playTrack = usePlayTrack()
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SearchForm>({ resolver: zodResolver(SearchSchema) })

  const searchResults = useSearchTracks(searchQuery, searchQuery.length >= 2)

  const onSubmit = (data: SearchForm) => {
    setSearchQuery(data.query)
  }

  const handleAdd = (track: SpotifyTrack) => {
    addTrack(track.uri)
    setShowForm(false)
    setSearchQuery('')
    setSelectedTrack(null)
    reset()
  }

  return (
    <div className="min-h-screen bg-white pt-16 px-4 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-6">
          <h1 className="text-2xl font-black text-black">Spoter List</h1>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 glass rounded-full text-sm font-medium text-black/70 hover:bg-black/5 transition-colors"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Fechar' : t('favorites.addButton')}
          </button>
        </div>

        {/* Formulário de busca */}
        {showForm && (
          <div className="glass-card p-5 mb-6">
            <h2 className="text-sm font-bold text-black mb-4">{t('favorites.addButton')}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 mb-4">
              <div className="flex-1">
                <input
                  {...register('query')}
                  placeholder={`${t('favorites.title')} ou artista...`}
                  className="w-full px-4 py-2.5 bg-black/5 rounded-xl text-sm text-black placeholder:text-black/30 outline-none focus:bg-black/8 transition-colors"
                />
                {errors.query && (
                  <p className="text-xs text-red-500 mt-1 ml-1">{errors.query.message}</p>
                )}
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/80 transition-colors"
              >
                <Search size={16} />
              </button>
            </form>

            {/* Resultados da busca */}
            {searchResults.isPending && searchQuery && (
              <p className="text-xs text-black/40 text-center py-3">{t('common.loading')}</p>
            )}
            {searchResults.data?.length === 0 && searchQuery && (
              <p className="text-xs text-red-500 text-center py-3">{t('favorites.notFound')}</p>
            )}
            {searchResults.data && searchResults.data.length > 0 && (
              <div className="space-y-1">
                {searchResults.data.map(track => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedTrack(track)}
                  >
                    <img
                      src={track.album.images[0]?.url}
                      className="w-9 h-9 rounded-lg object-cover shrink-0"
                      alt={track.album.name}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black truncate">{track.name}</p>
                      <p className="text-xs text-black/50 truncate">
                        {track.artists.map(a => a.name).join(', ')}
                      </p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleAdd(track) }}
                      className="px-3 py-1 bg-black text-white rounded-full text-xs font-medium hover:bg-black/80 transition-colors shrink-0"
                    >
                      + Adicionar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lista da playlist */}
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 glass-card animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && tracks.length === 0 && (
          <div className="text-center py-20">
            <p className="text-black/30">{t('favorites.emptyList')}</p>
          </div>
        )}

        {!isLoading && tracks.length > 0 && (
          <div className="space-y-1">
            {tracks.map(track => (
              <div key={track.id} className="flex items-center group">
                <div className="flex-1">
                  <TrackRow
                    track={track}
                    isActive={false}
                    onPlay={playTrack}
                  />
                </div>
                <button
                  onClick={() => removeTrack(track.uri)}
                  className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
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

- [ ] **Step 2: Adicionar chaves i18n**

Em `src/locales/pt-BR.json`, dentro do objeto `"favorites"`:
```json
"notFound": "Nenhuma música encontrada no Spotify",
"addButton": "Adicionar música"
```
Em `src/locales/en-US.json`:
```json
"notFound": "No songs found on Spotify",
"addButton": "Add song"
```

- [ ] **Step 3: Commit**
```bash
git add src/pages/Favorites.tsx src/locales/pt-BR.json src/locales/en-US.json
git commit -m "feat: Favorites — Spoter List com form busca Spotify, feedback de erro"
```

---

## Fase 7 — i18n, OAuth e finalização

### Task 25: i18n novas chaves + OAuth scopes + Profile

**Files:**
- Modify: `src/locales/pt-BR.json`
- Modify: `src/locales/en-US.json`
- Modify: `src/contexts/AuthContext.tsx`
- Modify: `src/pages/Profile.tsx`

- [ ] **Step 1: Adicionar chaves i18n faltantes**

Em `src/locales/pt-BR.json`:
```json
"nav": {
  ...,
  "logout": "Sair"
},
"player": {
  ...,
  "noActiveDevice": "Nenhum dispositivo ativo",
  "lyrics": "Letra"
}
```
Em `src/locales/en-US.json`:
```json
"nav": {
  ...,
  "logout": "Sign out"
},
"player": {
  ...,
  "noActiveDevice": "No active device",
  "lyrics": "Lyrics"
}
```

- [ ] **Step 2: Adicionar scopes playlist em `src/contexts/AuthContext.tsx`**

Localizar o array `SCOPES` e adicionar:
```typescript
const SCOPES = [
  'user-read-private', 'user-read-email',
  'user-top-read', 'user-read-recently-played',
  'user-library-read', 'user-follow-read',
  'user-read-playback-state', 'user-modify-playback-state',
  'streaming', 'playlist-read-private',
  'playlist-modify-private', 'playlist-modify-public', // novos
].join(' ')
```

- [ ] **Step 3: Rebuild mínimo de Profile**

Substituir `src/pages/Profile.tsx`:

```tsx
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'

export function Profile() {
  const { t } = useTranslation()
  const { state } = useAuth()
  const profile = state.profile

  if (!profile) return null

  return (
    <div className="min-h-screen bg-white pt-16 px-6 pb-24">
      <div className="max-w-lg mx-auto pt-8">
        <div className="glass-card p-8 flex flex-col items-center gap-4">
          {profile.images[0]?.url ? (
            <img
              src={profile.images[0].url}
              alt={profile.display_name}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-black/10 flex items-center justify-center text-4xl font-bold text-black/30">
              {profile.display_name[0]}
            </div>
          )}
          <div className="text-center">
            <h1 className="text-xl font-black text-black">{profile.display_name}</h1>
            <p className="text-sm text-black/50 mt-1">{profile.email}</p>
            <p className="text-xs text-black/30 mt-0.5">{profile.country}</p>
          </div>
          <div className="flex gap-6 mt-2">
            <div className="text-center">
              <p className="text-lg font-bold text-black">{profile.followers.total}</p>
              <p className="text-xs text-black/40">{t('artists.followers')}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-black capitalize">{profile.product}</p>
              <p className="text-xs text-black/40">Plano</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Build final**
```bash
npm run build 2>&1 | tail -30
```
Esperado: sem erros TypeScript.

- [ ] **Step 5: Rodar todos os testes**
```bash
npm test
```
Esperado: todos passam.

- [ ] **Step 6: Commit final**
```bash
git add src/locales/ src/contexts/AuthContext.tsx src/pages/Profile.tsx
git commit -m "feat: i18n chaves completas, scopes playlist, Profile rebuild"
```

---

## Self-Review

### Cobertura do spec

| Requisito | Task |
|---|---|
| Demo funcional / API Spotify | Tasks 2–4 (player fixes) |
| Listagem artistas 20/pág sem tabela | Task 18 |
| Filtro artista + álbum | Task 18 |
| Detalhe artista + top tracks + discografia | Task 19 |
| Tabela paginada na página de detalhe | Task 19 |
| Tradução PT-BR / EN-US | Task 25 + keys em tasks 19, 24 |
| Gráfico(s) | Task 19 (RadarChart) |
| Form favoritos + LocalStorage + validação | Task 24 |
| Vinil como elemento central | Tasks 6, 17 |
| Cards em arco | Tasks 8, 17, 19 |
| Frosted glass menus/player | Tasks 5, 12, 13 |
| Animações framer-motion | Tasks 6, 8, 12, 14, 16 |
| Spotify Playlist "Spoter List" | Tasks 21–24 |
| Busca tracks no Spotify (form favoritos) | Tasks 21, 24 |
| Erro visual quando sem resultado | Task 24 |
| Player /player com lyrics + queue | Task 14 |
| MiniPlayer redesign wireframe | Task 13 |
| Progress bar fluida | Tasks 2–3 |
| Scopes playlist | Task 25 |

### Gaps encontrados

- `formatDuration` em `src/utils/formatDuration.ts` — importado em várias tasks, confirmar que o path existe ✓
- `useArtist` (singular) — importado em Task 19, hook existente ✓
- `ToastProvider` precisa estar no `main.tsx` — verificar durante execução (step de build detecta)

### Type consistency

- `SearchTab` exportado de `SearchBar.tsx` e importado em `Home.tsx`, `Artists.tsx` ✓
- `useSpoterPlaylist` retorna `tracks: SpotifyTrack[]` e `Favorites.tsx` usa `track.uri` ✓
- `usePlayTrack` retorna `(track, queue?) => Promise<void>`, usado consistentemente ✓
