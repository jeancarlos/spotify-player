# Lyrics Sync Refactor — Design Spec

**Date:** 2026-05-23
**Status:** Approved

## Problem

O sistema de letras tem dois problemas distintos:

1. **Sync drift**: o progresso é calculado acumulando ticks de 100ms via `setInterval`. Isso faz o progresso avançar mais rápido que o áudio real. O threshold de correção de 1000ms é muito alto — as letras ficam ~500ms adiantadas e nunca corrigem.

2. **Renderer inadequado**: o `LyricsView` renderiza todas as linhas num container com scroll. O scroll `smooth` conflita com mudanças rápidas de `activeIndex`, causando animações sobrepostas. O design pedido (4 anteriores + ativa + 4 próximas, sempre centrado) não é viável com scroll.

## Abordagem: Time-Reference Engine + Windowed Renderer

### 1. Sync Engine — `useProgressEngine`

Substituir o modelo acumulativo por um modelo de referência temporal.

**Estado interno:**
```ts
type ProgressRef = {
  baseProgress: number  // ms da posição conhecida
  baseTime: number      // Date.now() quando capturado
  isPlaying: boolean
}
```

**Cálculo em tempo real:**
```ts
function getCurrentProgress(ref: ProgressRef): number {
  if (!ref.isPlaying) return ref.baseProgress
  return ref.baseProgress + (Date.now() - ref.baseTime)
}
```

**Atualização via Spotify API (a cada 3s):**
```ts
const adjustedProgress = data.progress_ms + (Date.now() - data.timestamp)
setRef({ baseProgress: adjustedProgress, baseTime: Date.now(), isPlaying: data.is_playing })
```

- Sem threshold de drift — sempre sincroniza com a referência da API
- Erro máximo = latência de 1 poll (~150ms), nunca acumula
- Seek manual: atualiza `baseProgress` + `baseTime` imediatamente, sem debounce

**Interface exposta:**
```ts
function useProgressEngine(): {
  currentProgress: number   // re-render a cada 100ms via setInterval (só pra trigger)
  seekTo: (ms: number) => void
}
```

O `setInterval(100ms)` existe apenas para forçar re-render — o `currentProgress` calculado sempre usa `Date.now()`, então não acumula erro.

### 2. Windowed Renderer — `LyricsView` (reescrito)

9 slots fixos. Linha ativa sempre no slot 4 (índice central). Zero scroll.

**Layout dos slots:**
```
slot 0  │ ghost ou linha i-4  │ opacity 0.05, blur 4px
slot 1  │ linha i-3           │ opacity 0.10, blur 3px
slot 2  │ linha i-2           │ opacity 0.18, blur 2px
slot 3  │ linha i-1           │ opacity 0.35, blur 1px
slot 4  │ linha i  (ACTIVE)   │ opacity 1.00, blur 0px  ← sempre centrado
slot 5  │ linha i+1           │ opacity 0.35, blur 1px
slot 6  │ linha i+2           │ opacity 0.18, blur 2px
slot 7  │ linha i+3           │ opacity 0.10, blur 3px
slot 8  │ ghost ou linha i+4  │ opacity 0.05, blur 4px
```

**Ghost lines**: string vazia, não clicável, preenche slots no início e fim da letra.

**Container**: `h-full flex flex-col justify-center`, altura fixa por slot, sem overflow.

**Animação**: framer-motion `animate` por slot — opacity + blur transition 0.3s. Quando `activeIndex` muda, todos os slots recebem novos targets simultaneamente.

**Click-to-seek**: habilitado em linhas reais, desabilitado em ghosts.

**Troca de faixa**: `activeIndex` reseta sem animação (1 frame sem transition).

### 3. Estados Especiais

| Estado | Comportamento |
|--------|--------------|
| Sem letra | Mensagem no slot 4 (centro) |
| Carregando | Skeleton pulsante nos 9 slots |
| plainLyrics | Funciona igual — timestamps estimados por `parsePlainLyrics` |
| Linha longa | `line-clamp-2` no slot, altura fixa não expande |

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/hooks/useProgressEngine.ts` | Criar |
| `src/components/layout/LyricsView.tsx` | Reescrever |
| `src/hooks/usePlayerSync.ts` | Modificar — remove `TICK_PROGRESS`, delega pra `useProgressEngine` |
| `src/components/layout/PlayerView.tsx` | Modificar — passa `seekTo` pro `LyricsView` |
| `src/contexts/playerReducer.ts` | Modificar — remove action `TICK_PROGRESS` se não usada em outro lugar |

## Intocados

- `src/hooks/queries/useLyrics.ts`
- `src/utils/lrcParser.ts`
- `src/components/layout/LyricsPreloader.tsx`
- `src/types/lyrics.ts`

## Fonte de Letras

Apenas **lrclib.net**. A API interna do Spotify (`spclient.wg.spotify.com`) é bloqueada por CORS no browser sem proxy — não viável sem infraestrutura adicional.
