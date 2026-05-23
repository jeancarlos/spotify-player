# Lyrics Sync Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o modelo acumulativo de progresso por referência temporal e o renderer de scroll por uma janela de 9 slots fixos, eliminando drift de sincronia nas letras.

**Architecture:** `useProgressEngine` mantém um `ProgressRef` (`baseProgress + baseTime`) atualizado pela API do Spotify a cada 3s; `currentProgress` é calculado como `baseProgress + (Date.now() - baseTime)` a cada render — zero acumulação. `LyricsView` é reescrito para renderizar exatamente 9 slots fixos (4 anteriores + ativo + 4 próximos), sem scroll.

**Tech Stack:** React hooks, framer-motion, React Query (deduplicado — sem chamadas extras à API), Vitest + Testing Library, Tailwind CSS.

---

## File Map

| Arquivo | Ação |
|---------|------|
| `src/hooks/useProgressEngine.ts` | Criar — time-reference engine |
| `src/hooks/__tests__/useProgressEngine.test.ts` | Criar — testes do engine |
| `src/components/layout/LyricsView.tsx` | Reescrever — windowed renderer |
| `src/components/layout/__tests__/LyricsView.test.tsx` | Reescrever — testes do renderer |
| `src/components/layout/PlayerView.tsx` | Modificar — usar `useProgressEngine` |

---

## Task 1: `useProgressEngine` — Time-Reference Engine

**Files:**
- Create: `src/hooks/__tests__/useProgressEngine.test.ts`
- Create: `src/hooks/useProgressEngine.ts`

- [ ] **Step 1: Criar o arquivo de teste**

```ts
// src/hooks/__tests__/useProgressEngine.test.ts
import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

vi.mock('@/hooks/queries/useNowPlaying', () => ({
  useNowPlaying: vi.fn().mockReturnValue({ data: null }),
}))
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ state: { isAuthenticated: true } }),
}))

import { useNowPlaying } from '@/hooks/queries/useNowPlaying'
import { useProgressEngine } from '../useProgressEngine'

describe('useProgressEngine', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns 0 when no API data', () => {
    vi.mocked(useNowPlaying).mockReturnValue({ data: null } as any)
    const { result } = renderHook(() => useProgressEngine())
    expect(result.current.currentProgress).toBe(0)
  })

  it('returns baseProgress when paused', () => {
    const now = 1_000_000
    vi.setSystemTime(now)
    vi.mocked(useNowPlaying).mockReturnValue({
      data: { is_playing: false, progress_ms: 5000, timestamp: now },
    } as any)
    const { result } = renderHook(() => useProgressEngine())
    expect(result.current.currentProgress).toBe(5000)
  })

  it('advances progress when playing', () => {
    const now = 1_000_000
    vi.setSystemTime(now)
    vi.mocked(useNowPlaying).mockReturnValue({
      data: { is_playing: true, progress_ms: 5000, timestamp: now },
    } as any)
    const { result } = renderHook(() => useProgressEngine())
    act(() => { vi.advanceTimersByTime(2000) })
    expect(result.current.currentProgress).toBeGreaterThanOrEqual(7000)
  })

  it('seekTo updates currentProgress immediately', () => {
    const now = 1_000_000
    vi.setSystemTime(now)
    vi.mocked(useNowPlaying).mockReturnValue({
      data: { is_playing: false, progress_ms: 5000, timestamp: now },
    } as any)
    const { result } = renderHook(() => useProgressEngine())
    act(() => { result.current.seekTo(30000) })
    expect(result.current.currentProgress).toBe(30000)
  })
})
```

- [ ] **Step 2: Executar os testes — devem falhar**

```bash
npx vitest run src/hooks/__tests__/useProgressEngine.test.ts
```

Esperado: `Cannot find module '../useProgressEngine'`

- [ ] **Step 3: Criar o hook**

```ts
// src/hooks/useProgressEngine.ts
import { useRef, useState, useEffect, useCallback } from 'react'
import { useNowPlaying } from '@/hooks/queries/useNowPlaying'
import { useAuth } from '@/hooks/useAuth'

interface ProgressRef {
  baseProgress: number
  baseTime: number
  isPlaying: boolean
}

export function useProgressEngine(): {
  currentProgress: number
  seekTo: (ms: number) => void
} {
  const { state: authState } = useAuth()
  const { data } = useNowPlaying(authState.isAuthenticated)
  const ref = useRef<ProgressRef>({ baseProgress: 0, baseTime: Date.now(), isPlaying: false })
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!data || data.progress_ms === null) return
    const adjustedProgress = data.is_playing
      ? data.progress_ms + (Date.now() - data.timestamp)
      : data.progress_ms
    ref.current = { baseProgress: adjustedProgress, baseTime: Date.now(), isPlaying: data.is_playing }
  }, [data])

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 100)
    return () => clearInterval(id)
  }, [])

  const currentProgress = ref.current.isPlaying
    ? ref.current.baseProgress + (Date.now() - ref.current.baseTime)
    : ref.current.baseProgress

  const seekTo = useCallback((ms: number) => {
    ref.current = { baseProgress: ms, baseTime: Date.now(), isPlaying: ref.current.isPlaying }
    setTick(t => t + 1)
  }, [])

  return { currentProgress, seekTo }
}
```

- [ ] **Step 4: Executar os testes — devem passar**

```bash
npx vitest run src/hooks/__tests__/useProgressEngine.test.ts
```

Esperado: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useProgressEngine.ts src/hooks/__tests__/useProgressEngine.test.ts
git commit -m "feat: add useProgressEngine with time-reference model for accurate lyrics sync"
```

---

## Task 2: `LyricsView` — Windowed Renderer (9 slots fixos)

**Files:**
- Rewrite: `src/components/layout/LyricsView.tsx`
- Rewrite: `src/components/layout/__tests__/LyricsView.test.tsx`

Constantes de design para os 9 slots (distância 0 = slot ativo no centro):
```
slot 0 (dist -4): opacity 0.05, blur 4px
slot 1 (dist -3): opacity 0.10, blur 3px
slot 2 (dist -2): opacity 0.18, blur 2px
slot 3 (dist -1): opacity 0.35, blur 1px
slot 4 (dist  0): opacity 1.00, blur 0px  ← ATIVO, sempre aqui
slot 5 (dist +1): opacity 0.35, blur 1px
slot 6 (dist +2): opacity 0.18, blur 2px
slot 7 (dist +3): opacity 0.10, blur 3px
slot 8 (dist +4): opacity 0.05, blur 4px
```

Ghost lines (slots sem linha correspondente): `null` → texto vazio, não clicável.

- [ ] **Step 1: Reescrever os testes**

```tsx
// src/components/layout/__tests__/LyricsView.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LyricsView } from '../LyricsView'
import type { LyricLine } from '@/types/lyrics'

const manyLines: LyricLine[] = Array.from({ length: 20 }, (_, i) => ({
  time: i * 5000,
  text: `Linha ${i}`,
}))

const fewLines: LyricLine[] = [
  { time: 0, text: 'Primeira' },
  { time: 10000, text: 'Segunda' },
  { time: 20000, text: 'Terceira' },
]

describe('LyricsView', () => {
  it('shows empty state message when lines is empty', () => {
    render(<LyricsView lines={[]} progress={0} />)
    expect(screen.getByText('Sem letra disponível')).toBeInTheDocument()
  })

  it('active slot (slot 4) always has font-bold', () => {
    render(<LyricsView lines={manyLines} progress={0} />)
    expect(screen.getByText('Linha 0')).toHaveClass('font-bold')
  })

  it('highlights the correct line based on progress', () => {
    // progress=25000ms → activeIndex=5 (time: 5*5000=25000)
    render(<LyricsView lines={manyLines} progress={25000} />)
    expect(screen.getByText('Linha 5')).toHaveClass('font-bold')
  })

  it('does not render lines outside the 9-slot window', () => {
    // activeIndex=10 → window shows lines 6-14; line 0 not in DOM
    render(<LyricsView lines={manyLines} progress={50000} />)
    expect(screen.getByText('Linha 10')).toBeInTheDocument()
    expect(screen.queryByText('Linha 0')).not.toBeInTheDocument()
  })

  it('renders ghost slots when near the start', () => {
    // activeIndex=0 → slots 0-3 are ghost; lines 0-4 are in slots 4-8
    render(<LyricsView lines={fewLines} progress={0} />)
    expect(screen.getByText('Primeira')).toBeInTheDocument()
    // line beyond window should not appear
    expect(screen.queryByText('Linha 5')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Executar os testes — devem falhar**

```bash
npx vitest run src/components/layout/__tests__/LyricsView.test.tsx
```

Esperado: vários falhos (renderer ainda é o antigo).

- [ ] **Step 3: Reescrever `LyricsView.tsx`**

```tsx
// src/components/layout/LyricsView.tsx
import { motion } from 'framer-motion'
import type { LyricLine } from '@/types/lyrics'

const WINDOW = 4
const SLOT_OPACITY = [0.05, 0.10, 0.18, 0.35, 1.00, 0.35, 0.18, 0.10, 0.05]
const SLOT_BLUR    = [4, 3, 2, 1, 0, 1, 2, 3, 4]

interface LyricsViewProps {
  lines: LyricLine[]
  progress: number
  onSeek?: (ms: number) => void
}

export function LyricsView({ lines, progress, onSeek }: LyricsViewProps) {
  if (lines.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-white/20 text-sm">Sem letra disponível</p>
      </div>
    )
  }

  const foundIndex = lines.findLastIndex(line => line.time <= progress)
  const activeIndex = Math.max(0, foundIndex)

  const slots = Array.from({ length: WINDOW * 2 + 1 }, (_, i) => {
    const lineIdx = activeIndex - WINDOW + i
    if (lineIdx < 0 || lineIdx >= lines.length) return null
    return lines[lineIdx]
  })

  return (
    <div className="h-full flex flex-col justify-center gap-6 px-8">
      {slots.map((line, i) => {
        const isActive = i === WINDOW

        return (
          <motion.div
            key={i}
            animate={{
              opacity: SLOT_OPACITY[i],
              filter: `blur(${SLOT_BLUR[i]}px)`,
            }}
            transition={{ duration: 0.3 }}
            onClick={line && onSeek ? () => onSeek(line.time) : undefined}
            className={`text-center leading-tight select-none line-clamp-2 ${
              isActive
                ? 'text-white font-bold text-2xl md:text-3xl'
                : 'text-white text-lg md:text-xl'
            } ${line && onSeek ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
          >
            {line?.text ?? ''}
          </motion.div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Executar os testes — devem passar**

```bash
npx vitest run src/components/layout/__tests__/LyricsView.test.tsx
```

Esperado: `5 passed`

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/LyricsView.tsx src/components/layout/__tests__/LyricsView.test.tsx
git commit -m "feat: rewrite LyricsView as 9-slot windowed renderer with blur gradient"
```

---

## Task 3: Wiring `PlayerView` — Conectar `useProgressEngine`

**Files:**
- Modify: `src/components/layout/PlayerView.tsx`

`PlayerView` atualmente passa `state.progress` para `LyricsView`. Agora deve:
1. Chamar `useProgressEngine()` para obter `currentProgress` (preciso, atualizado a cada 100ms via time-reference)
2. Passar `currentProgress` para `LyricsView` em vez de `state.progress`
3. Chamar `seekTo(ms)` em `handleSeek` para o `useProgressEngine` atualizar imediatamente após seek via clique na letra

- [ ] **Step 1: Atualizar `PlayerView.tsx`**

Localizar as linhas relevantes e aplicar o diff abaixo:

```diff
// Adicionar import no topo (junto com outros imports)
+ import { useProgressEngine } from '@/hooks/useProgressEngine'

// Dentro de PlayerView(), logo após as destructurações existentes:
  const { currentTrack, progress, duration } = state
+ const { currentProgress, seekTo } = useProgressEngine()

// Atualizar handleSeek para também chamar seekTo:
  const handleSeek = useCallback(async (ms: number) => {
    dispatch({ type: 'SET_PROGRESS', payload: ms, isManual: true })
+   seekTo(ms)
    try { 
      await api.put('/me/player/seek', null, { params: { position_ms: ms }, responseType: 'text' }) 
    } catch { /* silent */ }
- }, [dispatch])
+ }, [dispatch, seekTo])

// Atualizar a chamada de LyricsView — trocar progress={progress} por progress={currentProgress}
// e remover duration={duration} (prop não usada no novo renderer):
  <LyricsView
    lines={lyrics.data ?? []}
-   progress={progress}
-   duration={duration}
+   progress={currentProgress}
    onSeek={handleSeek}
  />
```

O arquivo completo do bloco `handleSeek` + `LyricsView` após o diff:

```tsx
import { useProgressEngine } from '@/hooks/useProgressEngine'

// dentro de PlayerView():
const { currentProgress, seekTo } = useProgressEngine()

const handleSeek = useCallback(async (ms: number) => {
  dispatch({ type: 'SET_PROGRESS', payload: ms, isManual: true })
  seekTo(ms)
  try { 
    await api.put('/me/player/seek', null, { params: { position_ms: ms }, responseType: 'text' }) 
  } catch { /* silent */ }
}, [dispatch, seekTo])

// no JSX:
<LyricsView
  lines={lyrics.data ?? []}
  progress={currentProgress}
  onSeek={handleSeek}
/>
```

- [ ] **Step 2: Verificar que TypeScript não tem erros**

```bash
npx tsc --noEmit
```

Esperado: sem erros. Se houver reclamação do `duration` prop removido, verifique se `LyricsViewProps` já não tem `duration` na interface (a interface foi simplificada na Task 2).

- [ ] **Step 3: Executar toda a suite de testes**

```bash
npx vitest run
```

Esperado: todos passando.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/PlayerView.tsx
git commit -m "feat: wire useProgressEngine to LyricsView for accurate real-time sync"
```

---

## Verificação Final

- [ ] Rodar o app e abrir a tela de letras no meio de uma música — a linha correta deve estar ativa imediatamente
- [ ] Avançar na música — letras devem acompanhar sem adiantar
- [ ] Clicar em uma linha — deve seekar e mostrar a linha correta instantaneamente
- [ ] Pausar e retomar — letras devem estar na posição correta

```bash
npx vitest run
npx tsc --noEmit
```
