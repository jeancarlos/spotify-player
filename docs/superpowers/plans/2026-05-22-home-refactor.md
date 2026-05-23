# Home Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Home screen to match the wireframe — disk animates in from the bottom, arc carousel explodes outward after the disk lands, track info is always visible below each album cover, no navigation arrows.

**Architecture:** Three file changes (VinylCard, ArcCarousel, Home) plus a test update. VinylCard loses the hover overlay and gains a static text area below the image. ArcCarousel gains a `baseDelay` prop and animates items from `(0, 0)` outward. Home removes arrow state/buttons, caps tracks at 7, and wraps VinylDisk in a `motion.div` entrance.

**Tech Stack:** React, TypeScript, Framer Motion, Tailwind CSS, Vitest + React Testing Library

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/pages/__tests__/Home.test.tsx` | Modify | Add failing assertions for removed arrows |
| `src/components/shared/VinylCard.tsx` | Modify | Remove hover overlay; static text below image |
| `src/components/vinyl/ArcCarousel.tsx` | Modify | Add `baseDelay` prop; animate from center outward |
| `src/pages/Home.tsx` | Modify | Remove arrows + state; disk entrance; arc params |

---

## Task 1: Add failing tests for arrow removal

**Files:**
- Modify: `src/pages/__tests__/Home.test.tsx`

- [ ] **Step 1: Add two assertions for absent nav buttons**

Open `src/pages/__tests__/Home.test.tsx` and add inside the `describe` block:

```tsx
it('não renderiza botão de navegação "Anterior"', async () => {
  renderHome()
  await screen.findByText('Mock Track 1')
  expect(screen.queryByRole('button', { name: /anterior/i })).not.toBeInTheDocument()
})

it('não renderiza botão de navegação "Próximo"', async () => {
  renderHome()
  await screen.findByText('Mock Track 1')
  expect(screen.queryByRole('button', { name: /próximo/i })).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/pages/__tests__/Home.test.tsx
```

Expected: the two new tests FAIL (`Expected element not to be in the document`). The existing two tests still pass.

- [ ] **Step 3: Commit the failing tests**

```bash
git add src/pages/__tests__/Home.test.tsx
git commit -m "test: assertions para ausência dos botões de navegação do arco"
```

---

## Task 2: VinylCard — remove hover overlay, add static text

**Files:**
- Modify: `src/components/shared/VinylCard.tsx`

- [ ] **Step 1: Replace the full file content**

```tsx
import { cn } from '@/lib/utils'
import type { SpotifyTrack } from '@/types/spotify'

interface VinylCardProps {
  track: SpotifyTrack
  isActive?: boolean
  onPlay?: (track: SpotifyTrack) => void
  size?: 'sm' | 'md'
}

export function VinylCard({
  track,
  isActive = false,
  onPlay,
  size = 'md',
}: VinylCardProps) {
  const dim = size === 'sm' ? 80 : 104

  return (
    <div
      className="cursor-pointer flex flex-col items-center gap-1"
      style={{ width: dim }}
      onClick={() => onPlay?.(track)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onPlay?.(track)}
      aria-label={`Tocar ${track.name}`}
    >
      <div
        className={cn(
          'glass-card overflow-hidden shrink-0',
          isActive && 'ring-2 ring-black/30'
        )}
        style={{ width: dim, height: dim, borderRadius: 14 }}
      >
        <img
          src={track.album.images[0]?.url ?? ''}
          alt={track.album.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>
      <div className="w-full px-0.5">
        <p className="text-[9px] font-semibold truncate text-center leading-tight text-black/80">
          {track.name}
        </p>
        <p className="text-[8px] truncate text-center text-black/50">
          {track.artists.map(a => a.name).join(', ')}
        </p>
      </div>
    </div>
  )
}
```

Note: `isFavorite` and `onFavorite` props removed — unused in the codebase (heart button is out of scope per spec).

- [ ] **Step 2: Run existing tests to verify nothing broke**

```bash
npx vitest run src/pages/__tests__/Home.test.tsx
```

Expected: the two original tests still pass; the two new arrow tests still fail (arrows not removed yet).

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/VinylCard.tsx
git commit -m "feat: VinylCard — texto estático abaixo da capa, remove overlay de hover"
```

---

## Task 3: ArcCarousel — baseDelay prop + explode from center

**Files:**
- Modify: `src/components/vinyl/ArcCarousel.tsx`

`★ Insight ─────────────────────────────────────`
Setting `initial={{ x: 0, y: 0 }}` on a motion.div that also has `x` and `y` in its `animate` value tells Framer to interpolate from the disk center to each arc position. The stagger delay creates the fan-opening effect. No extra state needed — pure declarative animation.
`─────────────────────────────────────────────────`

- [ ] **Step 1: Add `baseDelay` prop and update animation**

Replace the full `ArcCarousel` function (keep `calcArcPositions` and `ArcPosition` unchanged):

```tsx
interface ArcCarouselProps {
  items: React.ReactNode[]
  radius?: number
  arcDeg?: number
  offsetDeg?: number
  baseDelay?: number
}

export function ArcCarousel({
  items,
  radius = 300,
  arcDeg = 150,
  offsetDeg = 0,
  baseDelay = 0,
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
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                animate={{
                  x: pos.x,
                  y: pos.y - 60,
                  opacity: 1,
                  scale: 1,
                }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{
                  type: 'spring',
                  stiffness: 220,
                  damping: 22,
                  delay: baseDelay + i * 0.06,
                }}
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

- [ ] **Step 2: Run arc unit tests to verify `calcArcPositions` is untouched**

```bash
npx vitest run src/components/vinyl/__tests__/arcAngles.test.ts
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/vinyl/ArcCarousel.tsx
git commit -m "feat: ArcCarousel — baseDelay prop, cards expandem do centro do disco"
```

---

## Task 4: Home — remove arrows, disk entrance animation, wire params

**Files:**
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Replace the full file content**

```tsx
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useRecentlyPlayed } from '@/hooks/queries/useRecentlyPlayed'
import { usePlayer } from '@/hooks/usePlayer'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { VinylDisk } from '@/components/vinyl/VinylDisk'
import { ArcCarousel } from '@/components/vinyl/ArcCarousel'
import { VinylCard } from '@/components/shared/VinylCard'
import { SearchBar } from '@/components/shared/SearchBar'
import type { SearchTab } from '@/components/shared/SearchBar'
import type { SpotifyTrack } from '@/types/spotify'

const DISK_DONE_DELAY = 0.75

export function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state } = usePlayer()
  const playTrack = usePlayTrack()
  const recentlyPlayed = useRecentlyPlayed(7)

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
        {/* Arc Carousel — centered above the vinyl */}
        <div className="absolute bottom-[260px] left-1/2 -translate-x-1/2">
          {tracks.length > 0 && (
            <ArcCarousel
              items={tracks.map(track => (
                <VinylCard
                  key={track.id}
                  track={track}
                  isActive={state.currentTrack?.id === track.id}
                  onPlay={playTrack}
                  size="sm"
                />
              ))}
              radius={220}
              arcDeg={110}
              baseDelay={DISK_DONE_DELAY}
            />
          )}
        </div>

        {/* VinylDisk — entrance from bottom */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-[-20px]"
          initial={{ scale: 0.6, y: 80, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
        >
          <VinylDisk size="lg" isPlaying={state.isPlaying} albumArt={albumArt} />
        </motion.div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run all Home tests**

```bash
npx vitest run src/pages/__tests__/Home.test.tsx
```

Expected: **all 4 tests pass** — the two original plus the two new arrow-absence tests.

- [ ] **Step 3: Run full test suite to catch regressions**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: Home — entrada animada do disco, arco sem setas, 7 faixas recentes"
```

---

## Task 5: Visual verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Open http://localhost:5173 and verify**

Checklist:
- [ ] Disco entra com scale/fade de baixo ao carregar a Home
- [ ] Após o disco parar, os cards do arco se abrem em leque a partir do centro
- [ ] Nenhum botão de navegação visível
- [ ] Nome da faixa e nome do artista visíveis abaixo de cada capa (sem hover)
- [ ] Cards não se sobrepõem no arco
- [ ] Clicar em um card inicia a reprodução

- [ ] **Step 3: Final commit if any visual tweaks were needed**

```bash
git add -p
git commit -m "fix: ajustes visuais pós-verificação do arco"
```
