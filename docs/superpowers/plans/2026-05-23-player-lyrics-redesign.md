# Player Lyrics Redesign — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenhar a página `/player` para exibir lyrics animadas como view principal, renderizar o MiniPlayer nessa página com barra de seek, e trocar o painel lateral por um overlay de info da faixa.

**Architecture:** `PlayerView` deixa de ter controles inline — todos os controles (play/pause/prev/next/shuffle/repeat) ficam no `MiniPlayer`, que agora também renderiza dentro do `PlayerView` (rota `/player` continua fora do AppShell). `LyricsView` é um novo componente que estima a linha ativa via `progress/duration * lineCount` e anima a transição com Framer Motion. `useLyrics` passa a sempre buscar quando artista+título existem, e retorna `string[]` (linhas já parseadas). O painel lateral desaparece; um botão de info no header abre um overlay com capa + metadados.

**Tech Stack:** React 18, TypeScript, Framer Motion, TanStack Query v5, React Router v6, i18next, Tailwind CSS, Lucide React, Vitest + Testing Library

---

## Estrutura de arquivos

| Arquivo | Ação |
|---------|------|
| `src/hooks/queries/useLyrics.ts` | Modifica: remove `enabled`, retorna `string[]`, exporta `parseLyrics` |
| `src/hooks/queries/__tests__/parseLyrics.test.ts` | Cria: testes para `parseLyrics` |
| `src/components/layout/LyricsView.tsx` | Cria: componente de lyrics animadas |
| `src/components/layout/__tests__/LyricsView.test.tsx` | Cria: testes para `LyricsView` |
| `src/components/layout/MiniPlayer.tsx` | Modifica: remove early return, adiciona seek bar + duração |
| `src/components/layout/PlayerView.tsx` | Modifica: redesenho completo — lyrics-first, sem controles inline, MiniPlayer ao fundo |
| `src/locales/en-US.json` | Modifica: adiciona `player.trackInfo`, `player.back` |
| `src/locales/pt-BR.json` | Modifica: adiciona `player.trackInfo`, `player.back` |

---

## Task 1: Refatorar `useLyrics` — parsear letras em linhas

**Files:**
- Modify: `src/hooks/queries/useLyrics.ts`
- Create: `src/hooks/queries/__tests__/parseLyrics.test.ts`

- [ ] **Step 1: Criar o arquivo de teste**

```ts
// src/hooks/queries/__tests__/parseLyrics.test.ts
import { describe, it, expect } from 'vitest'
import { parseLyrics } from '../useLyrics'

describe('parseLyrics', () => {
  it('divide string por quebras de linha e remove linhas vazias', () => {
    const raw = 'Hello world\nThis is a song\n\nAnother line'
    expect(parseLyrics(raw)).toEqual(['Hello world', 'This is a song', 'Another line'])
  })

  it('remove espaços no início e fim de cada linha', () => {
    expect(parseLyrics('  linha 1  \n  linha 2  ')).toEqual(['linha 1', 'linha 2'])
  })

  it('retorna array vazio para string vazia', () => {
    expect(parseLyrics('')).toEqual([])
  })

  it('retorna array vazio para string apenas com espaços e quebras', () => {
    expect(parseLyrics('\n\n  \n')).toEqual([])
  })
})
```

- [ ] **Step 2: Rodar o teste para confirmar FAIL**

```bash
cd /home/jean/spotify-player && npx vitest run src/hooks/queries/__tests__/parseLyrics.test.ts
```

Esperado: FAIL com "parseLyrics is not a function" ou similar.

- [ ] **Step 3: Reescrever `useLyrics` com `parseLyrics` exportada**

```ts
// src/hooks/queries/useLyrics.ts
import { useQuery } from '@tanstack/react-query'

export function parseLyrics(text: string): string[] {
  return text.split('\n').map(l => l.trim()).filter(Boolean)
}

export function useLyrics(artist: string, title: string) {
  return useQuery<string[]>({
    queryKey: ['lyrics', artist, title],
    enabled: !!artist && !!title,
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
      )
      if (!res.ok) return []
      const data = (await res.json()) as { lyrics?: string; error?: string }
      return parseLyrics(data.lyrics ?? '')
    },
  })
}
```

> **Atenção:** o `enabled` original recebia um terceiro parâmetro booleano (panel === 'lyrics'). Ao remover esse param, as lyrics passam a ser buscadas assim que artista+título existirem — comportamento desejado porque agora lyrics é a view principal.

- [ ] **Step 4: Rodar o teste para confirmar PASS**

```bash
cd /home/jean/spotify-player && npx vitest run src/hooks/queries/__tests__/parseLyrics.test.ts
```

Esperado: 4 testes passando.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/queries/useLyrics.ts src/hooks/queries/__tests__/parseLyrics.test.ts
git commit -m "refactor: useLyrics retorna string[], exporta parseLyrics"
```

---

## Task 2: Criar componente `LyricsView`

**Files:**
- Create: `src/components/layout/LyricsView.tsx`
- Create: `src/components/layout/__tests__/LyricsView.test.tsx`

- [ ] **Step 1: Criar arquivo de teste**

```tsx
// src/components/layout/__tests__/LyricsView.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LyricsView } from '../LyricsView'

beforeEach(() => {
  // jsdom não implementa scrollIntoView — mock necessário
  Element.prototype.scrollIntoView = vi.fn()
})

describe('LyricsView', () => {
  const lines = ['Primeira linha', 'Segunda linha', 'Terceira linha']

  it('renderiza todas as linhas fornecidas', () => {
    render(<LyricsView lines={lines} progress={0} duration={30000} />)
    expect(screen.getByText('Primeira linha')).toBeInTheDocument()
    expect(screen.getByText('Segunda linha')).toBeInTheDocument()
    expect(screen.getByText('Terceira linha')).toBeInTheDocument()
  })

  it('a primeira linha é ativa quando progress=0', () => {
    render(<LyricsView lines={lines} progress={0} duration={30000} />)
    // index = floor(0/30000 * 3) = 0
    expect(screen.getByText('Primeira linha')).toHaveClass('font-bold')
  })

  it('destaca a linha do meio com font-bold no meio da música', () => {
    render(<LyricsView lines={lines} progress={10000} duration={30000} />)
    // index = floor(10000/30000 * 3) = floor(1.0) = 1
    expect(screen.getByText('Segunda linha')).toHaveClass('font-bold')
  })

  it('a última linha é ativa ao fim da música', () => {
    render(<LyricsView lines={lines} progress={30000} duration={30000} />)
    // index = min(2, floor(30000/30000 * 3)) = min(2, 3) = 2
    expect(screen.getByText('Terceira linha')).toHaveClass('font-bold')
  })

  it('retorna null para array vazio sem erros', () => {
    const { container } = render(<LyricsView lines={[]} progress={0} duration={30000} />)
    expect(container.firstChild).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar o teste para confirmar FAIL**

```bash
cd /home/jean/spotify-player && npx vitest run src/components/layout/__tests__/LyricsView.test.tsx
```

Esperado: FAIL com "Cannot find module '../LyricsView'" ou similar.

- [ ] **Step 3: Criar `LyricsView.tsx`**

```tsx
// src/components/layout/LyricsView.tsx
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface LyricsViewProps {
  lines: string[]
  progress: number
  duration: number
}

export function LyricsView({ lines, progress, duration }: LyricsViewProps) {
  const activeIndex = duration > 0
    ? Math.min(lines.length - 1, Math.floor((progress / duration) * lines.length))
    : 0
  const activeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeIndex])

  return (
    <div className="flex-1 overflow-y-auto flex flex-col items-center py-16 gap-5 px-8 scrollbar-hide">
      {lines.map((line, i) => {
        const dist = Math.abs(i - activeIndex)
        const isActive = i === activeIndex
        return (
          <motion.div
            key={i}
            ref={isActive ? activeRef : undefined}
            animate={{
              opacity: isActive ? 1 : Math.max(0.12, 1 - dist * 0.22),
              scale: isActive ? 1.04 : 1,
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`text-center leading-relaxed ${
              isActive
                ? 'text-white font-bold text-xl'
                : 'text-white/50 text-base font-normal'
            }`}
          >
            {line}
          </motion.div>
        )
      })}
    </div>
  )
}
```

> **Por que `Math.max(0.12, 1 - dist * 0.22)`?** Garante que linhas distantes fiquem levemente visíveis (12%) em vez de desaparecerem totalmente. Faz a leitura periférica mais natural.

- [ ] **Step 4: Rodar o teste para confirmar PASS**

```bash
cd /home/jean/spotify-player && npx vitest run src/components/layout/__tests__/LyricsView.test.tsx
```

Esperado: 5 testes passando.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/LyricsView.tsx src/components/layout/__tests__/LyricsView.test.tsx
git commit -m "feat: componente LyricsView com animação de linha ativa"
```

---

## Task 3: Atualizar i18n — adicionar chaves do player

**Files:**
- Modify: `src/locales/en-US.json`
- Modify: `src/locales/pt-BR.json`

- [ ] **Step 1: Adicionar chaves em `en-US.json`**

No objeto `"player"`, adicionar após `"pause"`:

```json
"trackInfo": "Track info",
"back": "Back"
```

Resultado do bloco `"player"` completo:
```json
"player": {
  "nowPlaying": "Now playing",
  "noTrack": "No track selected",
  "noActiveDevice": "No active device",
  "lyrics": "Lyrics",
  "queue": "Play queue",
  "closeQueue": "Close queue",
  "shuffle": "Shuffle",
  "previous": "Previous",
  "next": "Next",
  "repeat": "Repeat",
  "play": "Play",
  "pause": "Pause",
  "trackInfo": "Track info",
  "back": "Back"
}
```

- [ ] **Step 2: Adicionar chaves em `pt-BR.json`**

No objeto `"player"`, adicionar após `"pause"`:

```json
"trackInfo": "Informações da faixa",
"back": "Voltar"
```

- [ ] **Step 3: Commit**

```bash
git add src/locales/en-US.json src/locales/pt-BR.json
git commit -m "i18n: adicionar player.trackInfo e player.back"
```

---

## Task 4: Adicionar seek bar ao `MiniPlayer`

**Files:**
- Modify: `src/components/layout/MiniPlayer.tsx`

O MiniPlayer precisa:
1. Remover o early return `if (location.pathname === '/player') return null` — agora ele renderiza em todas as rotas onde for montado (AppShell nas outras páginas, PlayerView na página `/player`)
2. Adicionar `progress` e `duration` ao destructuring do state
3. Adicionar `handleSeek` callback
4. Importar `formatDuration`
5. Trocar o wrapper externo de `<div className="fixed rounded-full ...">` para dois elementos: barra de seek + pill

- [ ] **Step 1: Abrir `src/components/layout/MiniPlayer.tsx` e localizar as seções a modificar**

Seções a mudar:
- Linha 1–14: imports — adicionar `formatDuration`
- Linha 26: destructuring — adicionar `progress, duration`
- Linha 32: early return — remover
- Linha 34–44: `handlePlayPause` — manter igual
- Linha 46–48: `handlePrev` — manter igual
- Linha 50–53: `handleNext` — manter igual
- Linha 55–58: `toggleShuffle` — manter igual
- Linha 60–64: `cycleRepeat` — manter igual
- Linha 66+: return JSX — refatorar wrapper

- [ ] **Step 2: Reescrever `MiniPlayer.tsx` completo**

```tsx
// src/components/layout/MiniPlayer.tsx
import { useCallback } from 'react'
import {
  SkipBack, Play, Pause, SkipForward,
  Shuffle, Repeat, Repeat1, ListMusic, Home,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePlayer } from '@/hooks/usePlayer'
import { useToast } from '@/components/ui/toast'
import { useTranslation } from 'react-i18next'
import { WaveformBars } from '@/components/shared/WaveformBars'
import { VinylDisk } from '@/components/vinyl/VinylDisk'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/utils/formatDuration'
import api from '@/lib/axios'
import type { AxiosError } from 'axios'

function Tip({ label }: { label: string }) {
  return (
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 text-[10px] bg-black/80 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
      {label}
    </span>
  )
}

export function MiniPlayer() {
  const { state, dispatch } = usePlayer()
  const { currentTrack, isPlaying, shuffle, repeat, progress, duration } = state
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { t } = useTranslation()

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

  const toggleShuffle = useCallback(async () => {
    dispatch({ type: 'TOGGLE_SHUFFLE' })
    try { await api.put('/me/player/shuffle', null, { params: { state: !shuffle } }) } catch { /* silent */ }
  }, [dispatch, shuffle])

  const cycleRepeat = useCallback(async () => {
    const next = repeat === 'off' ? 'context' : repeat === 'context' ? 'track' : 'off'
    dispatch({ type: 'SET_REPEAT', payload: next })
    try { await api.put('/me/player/repeat', null, { params: { state: next } }) } catch { /* silent */ }
  }, [dispatch, repeat])

  const isPlayerPage = location.pathname === '/player'

  return (
    <div className="fixed bottom-2 left-2 right-2 z-30 max-w-[600px] mx-auto flex flex-col gap-0.5">
      {/* Seek bar — mostrada quando há faixa tocando */}
      {currentTrack && (
        <div className="px-3 flex items-center gap-2">
          <span className="text-[9px] text-black/30 w-7 text-right font-mono shrink-0">
            {formatDuration(progress)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={progress}
            onChange={handleSeek}
            aria-label={t('player.seek', 'Seek')}
            className="flex-1 h-1 appearance-none bg-black/10 rounded-full accent-black cursor-pointer"
          />
          <span className="text-[9px] text-black/30 w-7 font-mono shrink-0">
            {formatDuration(duration)}
          </span>
        </div>
      )}

      {/* Pill principal */}
      <div className="rounded-full glass border-t border-white/40 px-4 py-3 flex items-center gap-3">
        {/* Home — oculto na própria página do player */}
        {!isPlayerPage && (
          <div className="relative group shrink-0">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl hover:bg-black/5 transition-colors"
              aria-label={t('nav.home')}
            >
              <Home size={18} className="text-black/40" />
            </button>
            <Tip label={t('nav.home')} />
          </div>
        )}

        {/* Track info + waveform */}
        <div
          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer group/track"
          onClick={() => currentTrack && navigate('/player')}
        >
          {currentTrack ? (
            <>
              <VinylDisk
                size="xs"
                albumArt={currentTrack.album.images[0]?.url}
                isPlaying={isPlaying}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-black truncate group-hover/track:underline">
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
        {currentTrack && (
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Shuffle — oculto em telas pequenas */}
            <div className="relative group hidden sm:block">
              <button
                onClick={toggleShuffle}
                aria-label={t('player.shuffle')}
                className={cn('p-1.5 rounded-lg transition-colors', shuffle ? 'text-black' : 'text-black/30 hover:text-black/60')}
              >
                <Shuffle size={15} />
              </button>
              <Tip label={t('player.shuffle')} />
            </div>

            {/* Anterior */}
            <div className="relative group">
              <button
                onClick={handlePrev}
                aria-label={t('player.previous')}
                className="p-1.5 rounded-lg text-black/60 hover:text-black transition-colors"
              >
                <SkipBack size={18} className="fill-current" />
              </button>
              <Tip label={t('player.previous')} />
            </div>

            {/* Play / Pause */}
            <div className="relative group/play">
              <button
                onClick={handlePlayPause}
                aria-label={isPlaying ? t('player.pause') : t('player.play')}
                className="w-9 h-9 rounded-full bg-black flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                {isPlaying
                  ? <Pause size={14} className="fill-white text-white" />
                  : <Play size={14} className="fill-white text-white ml-0.5" />}
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 text-center text-[11px] text-white bg-black/85 rounded-lg px-3 py-2 opacity-0 group-hover/play:opacity-100 transition-opacity pointer-events-none whitespace-normal leading-snug z-50">
                {t('login.hint')}
              </div>
            </div>

            {/* Próximo */}
            <div className="relative group">
              <button
                onClick={handleNext}
                aria-label={t('player.next')}
                className="p-1.5 rounded-lg text-black/60 hover:text-black transition-colors"
              >
                <SkipForward size={18} className="fill-current" />
              </button>
              <Tip label={t('player.next')} />
            </div>

            {/* Repetir — oculto em telas pequenas */}
            <div className="relative group hidden sm:block">
              <button
                onClick={cycleRepeat}
                aria-label={t('player.repeat')}
                className={cn('p-1.5 rounded-lg transition-colors', repeat !== 'off' ? 'text-black' : 'text-black/30 hover:text-black/60')}
              >
                {repeat === 'track' ? <Repeat1 size={15} /> : <Repeat size={15} />}
              </button>
              <Tip label={t('player.repeat')} />
            </div>

            {/* Fila — oculto em telas pequenas e na página do player (já tem nav própria) */}
            {!isPlayerPage && (
              <div className="relative group hidden sm:block">
                <button
                  onClick={() => navigate('/player')}
                  aria-label={t('player.queue')}
                  className="p-1.5 rounded-lg text-black/30 hover:text-black transition-colors"
                >
                  <ListMusic size={15} />
                </button>
                <Tip label={t('player.queue')} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

> **Por que ocultar Home e Queue na página `/player`?** Nessa página já existe botão de back e o contexto é o player em si. Reduz clutter no bar.

- [ ] **Step 3: Rodar suite completa de testes para checar regressões**

```bash
cd /home/jean/spotify-player && npx vitest run
```

Esperado: todos os testes existentes passando.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/MiniPlayer.tsx
git commit -m "feat: miniplayer com seek bar e duração, remove early return"
```

---

## Task 5: Redesenhar `PlayerView` — lyrics-first

**Files:**
- Modify: `src/components/layout/PlayerView.tsx`

O novo `PlayerView`:
- **Header**: back button (esquerda) + "now playing" (centro) + info toggle (direita)
- **Área central**: `LyricsView` quando há lyrics, loading state, "not found" com capa, ou info overlay (quando `showInfo = true`)
- **Footer**: `<MiniPlayer />` (fixed, já cuida do próprio posicionamento)
- **Background**: capa do álbum blurred + overlay dark — igual ao design atual
- **Sem controles inline**: todos os controles ficam no MiniPlayer

> **Atenção:** `MiniPlayer` é `position: fixed`, então pode ser renderizado em qualquer ponto da árvore DOM. Ao incluir `<MiniPlayer />` dentro do `PlayerView`, ele aparecerá no viewport normalmente, já que `PlayerView` é montado quando `/player` está ativo (fora do AppShell — sem double render).

- [ ] **Step 1: Reescrever `PlayerView.tsx` completo**

```tsx
// src/components/layout/PlayerView.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePlayer } from '@/hooks/usePlayer'
import { useLyrics } from '@/hooks/queries/useLyrics'
import { LyricsView } from '@/components/layout/LyricsView'
import { MiniPlayer } from '@/components/layout/MiniPlayer'
import { formatDuration } from '@/utils/formatDuration'
import { cn } from '@/lib/utils'

export function PlayerView() {
  const { state } = usePlayer()
  const { currentTrack, progress, duration } = state
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [showInfo, setShowInfo] = useState(false)

  const artistName = currentTrack?.artists[0]?.name ?? ''
  const trackName = currentTrack?.name ?? ''
  const lyrics = useLyrics(artistName, trackName)
  const albumArt = currentTrack?.album.images[0]?.url

  return (
    <div className="relative min-h-screen bg-black overflow-hidden flex flex-col">
      {/* Background blur */}
      {albumArt && (
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `url(${albumArt})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(80px)',
            transform: 'scale(1.2)',
          }}
        />
      )}
      <div className="absolute inset-0 bg-black/60" />

      {/* Conteúdo relativo */}
      <div className="relative flex flex-col flex-1 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl glass"
            aria-label={t('player.back')}
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <p className="text-xs text-white/40 uppercase tracking-widest">
            {t('lyrics.nowPlaying')}
          </p>
          <button
            onClick={() => setShowInfo(v => !v)}
            className={cn('p-2 rounded-xl glass', showInfo && 'bg-white/20')}
            aria-label={t('player.trackInfo')}
          >
            <FileText size={18} className="text-white" />
          </button>
        </div>

        {/* Área principal */}
        <AnimatePresence mode="wait">
          {showInfo ? (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 px-8"
            >
              {albumArt && (
                <motion.img
                  key={currentTrack?.id}
                  src={albumArt}
                  alt={currentTrack?.album.name}
                  className="w-56 h-56 rounded-2xl object-cover shadow-2xl"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                />
              )}
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-white">{currentTrack?.name}</h2>
                <p className="text-white/60">
                  {currentTrack?.artists.map(a => a.name).join(', ')}
                </p>
                <p className="text-white/30 text-sm">{currentTrack?.album.name}</p>
                <p className="text-white/30 text-sm">{formatDuration(duration)}</p>
              </div>
            </motion.div>
          ) : lyrics.isPending ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <p className="text-white/30 text-sm">{t('lyrics.searching')}</p>
            </motion.div>
          ) : lyrics.data && lyrics.data.length > 0 ? (
            <LyricsView
              key="lyrics"
              lines={lyrics.data}
              progress={progress}
              duration={duration}
            />
          ) : (
            <motion.div
              key="notfound"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 px-8"
            >
              {albumArt && (
                <img
                  src={albumArt}
                  alt={currentTrack?.album.name}
                  className="w-56 h-56 rounded-2xl object-cover shadow-2xl opacity-70"
                />
              )}
              <p className="text-white/30 text-sm">{t('lyrics.notFound')}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MiniPlayer fixo ao fundo — position: fixed, pode estar em qualquer ponto da árvore */}
      <MiniPlayer />
    </div>
  )
}
```

- [ ] **Step 2: Rodar suite completa de testes**

```bash
cd /home/jean/spotify-player && npx vitest run
```

Esperado: todos os testes passando.

- [ ] **Step 3: Verificar no browser**

```bash
cd /home/jean/spotify-player && npm run dev
```

Checar:
- Acesse `/player` — deve mostrar fundo blurred + "searching lyrics..." ou lyrics animadas
- Botão `←` navega para trás
- Botão `📄` toggle mostra capa + info da faixa
- MiniPlayer aparece na parte de baixo com seek bar + controles
- Seek bar ao arrastar atualiza progresso
- Home e Queue estão ocultos no MiniPlayer quando em `/player`
- Outras páginas (Home, Artists) continuam mostrando MiniPlayer normalmente

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/PlayerView.tsx
git commit -m "feat: player redesenhado — lyrics animadas, painel de info, miniplayer"
```

---

## Checklist final

Após todos os commits:

```bash
cd /home/jean/spotify-player && npx vitest run
```

Todos passando? ✅ → Done.
