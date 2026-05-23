# Album Cover Flip — Plano de Implementação

> **Para agentes autônomos:** SUB-SKILL OBRIGATÓRIA: Use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar este plano tarefa por tarefa. Os passos usam sintaxe de checkbox (`- [ ]`) para rastreamento.

**Goal:** Adicionar flip 3D suave nas capas de álbum (AlbumDetail + TrackInfoPanel) usando back cover do Cover Art Archive, com tilt melhorado que desce a capa sobre o nome do álbum.

**Architecture:** Hook `useAlbumBackCover` busca back cover via MusicBrainz → CAA com cache em localStorage. Componente `FlippableCover` encapsula dois motion.div aninhados: externo para tilt (rotateX/Y, translateY, scale), interno para flip (rotateY 0→180). CollectionHeader e TrackInfoPanel delegam a lógica pro FlippableCover.

**Tech Stack:** React, Framer Motion, @tanstack/react-query, Vitest, @testing-library/react

---

## Mapa de Arquivos

| Arquivo | Ação |
|---|---|
| `src/hooks/queries/useAlbumBackCover.ts` | CRIAR |
| `src/hooks/__tests__/useAlbumBackCover.test.ts` | CRIAR |
| `src/components/shared/FlippableCover.tsx` | CRIAR |
| `src/components/shared/__tests__/FlippableCover.test.tsx` | CRIAR |
| `src/components/shared/CollectionHeader.tsx` | MODIFICAR |
| `src/pages/AlbumDetail.tsx` | MODIFICAR |
| `src/components/layout/TrackInfoPanel.tsx` | MODIFICAR |

---

## Task 1: Hook `useAlbumBackCover`

**Files:**
- Criar: `src/hooks/queries/useAlbumBackCover.ts`
- Criar (teste): `src/hooks/__tests__/useAlbumBackCover.test.ts`

- [ ] **Passo 1: Escrever o teste que falha**

Criar `src/hooks/__tests__/useAlbumBackCover.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useAlbumBackCover } from '@/hooks/queries/useAlbumBackCover'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

const MB_HIT = {
  releases: [{ id: 'mbid-123' }],
}

const CAA_HIT = {
  images: [
    { types: ['Front'], image: 'https://caa/front.jpg', thumbnails: { large: 'https://caa/front-lg.jpg' } },
    { types: ['Back'], image: 'https://caa/back.jpg', thumbnails: { large: 'https://caa/back-lg.jpg' } },
  ],
}

const CAA_NO_BACK = {
  images: [
    { types: ['Front'], image: 'https://caa/front.jpg', thumbnails: {} },
  ],
}

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useAlbumBackCover', () => {
  it('retorna null imediatamente quando albumId é undefined', () => {
    const { result } = renderHook(
      () => useAlbumBackCover(undefined, 'Album', 'Artista'),
      { wrapper: createWrapper() }
    )
    expect(result.current.backUrl).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('retorna backUrl quando MusicBrainz e CAA respondem com back cover', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => MB_HIT } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => CAA_HIT } as Response)

    const { result } = renderHook(
      () => useAlbumBackCover('alb-1', 'Abbey Road', 'The Beatles'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.backUrl).toBe('https://caa/back-lg.jpg')
  })

  it('retorna null quando CAA não tem imagem do tipo Back', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => MB_HIT } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => CAA_NO_BACK } as Response)

    const { result } = renderHook(
      () => useAlbumBackCover('alb-2', 'Album', 'Artista'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.backUrl).toBeNull()
  })

  it('retorna null quando MusicBrainz não retorna releases', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ releases: [] }) } as Response)

    const { result } = renderHook(
      () => useAlbumBackCover('alb-3', 'Desconhecido', 'Artista'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.backUrl).toBeNull()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('usa cache do localStorage e não refaz fetch', async () => {
    localStorage.setItem('caa:alb-cached', 'https://caa/cached-back.jpg')

    const { result } = renderHook(
      () => useAlbumBackCover('alb-cached', 'Album', 'Artista'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.backUrl).toBe('https://caa/cached-back.jpg')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('usa cache null do localStorage e não refaz fetch', async () => {
    localStorage.setItem('caa:alb-null', 'null')

    const { result } = renderHook(
      () => useAlbumBackCover('alb-null', 'Album', 'Artista'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.backUrl).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })
})
```

- [ ] **Passo 2: Rodar e confirmar falha**

```bash
npx vitest run src/hooks/__tests__/useAlbumBackCover.test.ts
```

Esperado: FAIL com `Cannot find module '@/hooks/queries/useAlbumBackCover'`

- [ ] **Passo 3: Implementar o hook**

Criar `src/hooks/queries/useAlbumBackCover.ts`:

```ts
import { useQuery } from '@tanstack/react-query'

interface MBSearchResult {
  releases: Array<{ id: string }>
}

interface CAAImage {
  types: string[]
  image: string
  thumbnails: { large?: string; '500'?: string }
}

interface CAAResponse {
  images: CAAImage[]
}

export function useAlbumBackCover(
  albumId: string | undefined,
  albumName: string,
  artistName: string,
): { backUrl: string | null; loading: boolean } {
  const { data, isLoading } = useQuery<string | null>({
    queryKey: ['album-back-cover', albumId],
    enabled: !!albumId && !!albumName && !!artistName,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const cacheKey = `caa:${albumId}`
      const cached = localStorage.getItem(cacheKey)
      if (cached !== null) return cached === 'null' ? null : cached

      try {
        const query = `release:"${albumName}"+artistname:"${artistName}"`
        const mbRes = await fetch(
          `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(query)}&limit=1&fmt=json`,
          { headers: { 'User-Agent': 'SpotifyPlayer/1.0 (jeancosouza@gmail.com)' } },
        )
        if (!mbRes.ok) { localStorage.setItem(cacheKey, 'null'); return null }

        const mbData: MBSearchResult = await mbRes.json()
        const mbid = mbData.releases?.[0]?.id
        if (!mbid) { localStorage.setItem(cacheKey, 'null'); return null }

        const caaRes = await fetch(`https://coverartarchive.org/release/${mbid}`)
        if (!caaRes.ok) { localStorage.setItem(cacheKey, 'null'); return null }

        const caaData: CAAResponse = await caaRes.json()
        const back = caaData.images.find(img => img.types.includes('Back'))
        const url = back?.thumbnails?.large ?? back?.thumbnails?.['500'] ?? back?.image ?? null

        localStorage.setItem(cacheKey, url ?? 'null')
        return url
      } catch {
        localStorage.setItem(cacheKey, 'null')
        return null
      }
    },
  })

  return { backUrl: data ?? null, loading: isLoading }
}
```

- [ ] **Passo 4: Rodar e confirmar verde**

```bash
npx vitest run src/hooks/__tests__/useAlbumBackCover.test.ts
```

Esperado: 6 testes PASS

- [ ] **Passo 5: Commit**

```bash
git add src/hooks/queries/useAlbumBackCover.ts src/hooks/__tests__/useAlbumBackCover.test.ts
git commit -m "feat: add useAlbumBackCover hook with MusicBrainz + CAA lookup and localStorage cache"
```

---

## Task 2: Componente `FlippableCover`

**Files:**
- Criar: `src/components/shared/FlippableCover.tsx`
- Criar (teste): `src/components/shared/__tests__/FlippableCover.test.tsx`

- [ ] **Passo 1: Escrever o teste que falha**

Criar `src/components/shared/__tests__/FlippableCover.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { FlippableCover } from '../FlippableCover'

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>()
  return {
    ...actual,
    useSpring: (v: unknown) => v,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: React.ComponentProps<'div'>) =>
        <div {...props}>{children}</div>,
    },
  }
})

describe('FlippableCover', () => {
  it('renderiza imagem da frente', () => {
    render(<FlippableCover frontUrl="https://img/front.jpg" size={200} name="Abbey Road" />)
    expect(screen.getByAltText('Abbey Road')).toBeInTheDocument()
  })

  it('modo flip: renderiza frente e verso quando backUrl é fornecido', () => {
    render(
      <FlippableCover
        frontUrl="https://img/front.jpg"
        backUrl="https://img/back.jpg"
        size={200}
        name="Abbey Road"
      />
    )
    expect(screen.getByAltText('Abbey Road')).toBeInTheDocument()
    expect(screen.getByAltText('Abbey Road - verso')).toBeInTheDocument()
  })

  it('modo tilt: não renderiza verso quando backUrl é null', () => {
    render(
      <FlippableCover
        frontUrl="https://img/front.jpg"
        backUrl={null}
        size={200}
        name="Album"
      />
    )
    expect(screen.queryByAltText('Album - verso')).not.toBeInTheDocument()
  })

  it('chama onClick ao clicar', async () => {
    const onClick = vi.fn()
    render(<FlippableCover frontUrl="https://img/front.jpg" size={200} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renderiza children na face da frente', () => {
    render(
      <FlippableCover frontUrl="https://img/front.jpg" backUrl="https://img/back.jpg" size={200}>
        <div data-testid="overlay">Overlay</div>
      </FlippableCover>
    )
    expect(screen.getByTestId('overlay')).toBeInTheDocument()
  })

  it('renderiza placeholder quando frontUrl é undefined', () => {
    render(<FlippableCover size={200} name="Sem capa" />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('♪')).toBeInTheDocument()
  })
})
```

- [ ] **Passo 2: Rodar e confirmar falha**

```bash
npx vitest run src/components/shared/__tests__/FlippableCover.test.tsx
```

Esperado: FAIL com `Cannot find module '../FlippableCover'`

- [ ] **Passo 3: Implementar o componente**

Criar `src/components/shared/FlippableCover.tsx`:

```tsx
import { useState, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface FlippableCoverProps {
  frontUrl?: string
  backUrl?: string | null
  size: number
  name?: string
  onClick?: () => void
  className?: string
  children?: React.ReactNode
}

const TILT = 12

export function FlippableCover({
  frontUrl,
  backUrl,
  size,
  name,
  onClick,
  className,
  children,
}: FlippableCoverProps) {
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const hasBack = !!backUrl

  const rotX = useMotionValue(0)
  const rotY = useMotionValue(0)
  const liftY = useMotionValue(0)
  const scaleV = useMotionValue(1)

  const springRotX = useSpring(rotX, { stiffness: 180, damping: 22 })
  const springRotY = useSpring(rotY, { stiffness: 180, damping: 22 })
  const springLiftY = useSpring(liftY, { stiffness: 180, damping: 22 })
  const springScale = useSpring(scaleV, { stiffness: 180, damping: 22 })

  function handleMouseEnter() {
    setIsHovered(true)
    liftY.set(24)
    scaleV.set(1.06)
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    rotY.set((px - 0.5) * TILT * 2)
    rotX.set((0.5 - py) * TILT * 2)
  }

  function handleMouseLeave() {
    setIsHovered(false)
    rotX.set(0)
    rotY.set(0)
    liftY.set(0)
    scaleV.set(1)
  }

  const frontContent = frontUrl ? (
    <img src={frontUrl} alt={name ?? ''} className="w-full h-full object-cover" draggable={false} />
  ) : (
    <div className="w-full h-full bg-black/10 flex items-center justify-center">
      <span className="text-5xl text-black/20">♪</span>
    </div>
  )

  return (
    <div
      className={cn('relative select-none shrink-0 group', className)}
      style={{
        width: size,
        height: size,
        perspective: '1200px',
      }}
    >
      <motion.div
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        style={{
          width: size,
          height: size,
          rotateX: springRotX,
          rotateY: springRotY,
          y: springLiftY,
          scale: springScale,
          transformStyle: 'preserve-3d',
          position: 'relative',
          zIndex: isHovered ? 10 : 0,
          boxShadow: isHovered
            ? '0 24px 60px rgba(0,0,0,0.45)'
            : '0 12px 40px rgba(0,0,0,0.28)',
          transition: 'box-shadow 0.2s',
          borderRadius: '0.75rem',
        }}
        whileTap={onClick ? { scale: 0.97 } : undefined}
      >
        {hasBack ? (
          <motion.div
            style={{
              width: '100%',
              height: '100%',
              transformStyle: 'preserve-3d',
              position: 'relative',
            }}
            animate={{ rotateY: isHovered ? 180 : 0 }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Frente */}
            <div
              className="absolute inset-0 rounded-xl overflow-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              {frontContent}
              {children}
            </div>
            {/* Verso */}
            <div
              className="absolute inset-0 rounded-xl overflow-hidden"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <img
                src={backUrl}
                alt={name ? `${name} - verso` : 'verso'}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          </motion.div>
        ) : (
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            {frontContent}
            {children}
          </div>
        )}
      </motion.div>
    </div>
  )
}
```

- [ ] **Passo 4: Rodar e confirmar verde**

```bash
npx vitest run src/components/shared/__tests__/FlippableCover.test.tsx
```

Esperado: 6 testes PASS

- [ ] **Passo 5: Commit**

```bash
git add src/components/shared/FlippableCover.tsx src/components/shared/__tests__/FlippableCover.test.tsx
git commit -m "feat: add FlippableCover component with 3D flip and tilt animations"
```

---

## Task 3: Integrar `CollectionHeader` + `AlbumDetail`

**Files:**
- Modificar: `src/components/shared/CollectionHeader.tsx`
- Modificar: `src/pages/AlbumDetail.tsx`

- [ ] **Passo 1: Atualizar `CollectionHeader`**

Substituir todo o conteúdo de `src/components/shared/CollectionHeader.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FlippableCover } from './FlippableCover'

interface CollectionHeaderProps {
  imageUrl: string | undefined
  backUrl?: string | null
  name: string
  subtitle: string
  year?: string
  playLabel: string
  onPlay: () => void
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
  const headerHeight = imgPx - translateY + 184

  return { imgPx, translateY, headerHeight }
}

export function CollectionHeader({
  imageUrl,
  backUrl,
  name,
  subtitle,
  year,
  playLabel,
  onPlay,
  onLayout,
}: CollectionHeaderProps) {
  const { imgPx, headerHeight } = useCollectionLayout()

  useEffect(() => {
    onLayout(headerHeight)
  }, [headerHeight, onLayout])

  return (
    <div className="">
      <div
        className="absolute left-1/2"
        style={{ transform: 'translateX(-50%) translateY(-16px)', top: 0 }}
      >
        <motion.div
          initial={{ scale: 0.8, y: 60, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <FlippableCover
            frontUrl={imageUrl}
            backUrl={backUrl}
            size={imgPx}
            name={name}
            onClick={onPlay}
          >
            <div className={cn(
              'absolute inset-0 rounded-xl flex items-center justify-center',
              'bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200',
            )}>
              <Play size={48} fill="white" color="white" className="drop-shadow-lg" />
            </div>
          </FlippableCover>
        </motion.div>
      </div>

      <motion.div
        className="absolute left-0 right-0 flex flex-col items-center pointer-events-auto"
        style={{ top: imgPx }}
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
            'hover:bg-black/80 active:scale-95 transition-all shadow-lg',
          )}
        >
          {playLabel}
        </button>
      </motion.div>
    </div>
  )
}
```

Nota: O `useState` precisa ser importado — adicionar `import { useState, useEffect } from 'react'` no topo. Remover `useMotionValue`, `useSpring`, `useRef` dos imports pois foram movidos para `FlippableCover`. Adicionar import do `FlippableCover`.

- [ ] **Passo 2: Atualizar `AlbumDetail` para passar `backUrl`**

Em `src/pages/AlbumDetail.tsx`, adicionar o import do hook e passar `backUrl` para `CollectionHeader`:

Adicionar import (logo após os imports existentes de hooks):
```tsx
import { useAlbumBackCover } from '@/hooks/queries/useAlbumBackCover'
```

Dentro de `AlbumDetail()`, após `const albumYear = ...`:
```tsx
const albumArtistName = album.data?.artists?.[0]?.name ?? ''
const { backUrl } = useAlbumBackCover(album.data?.id, album.data?.name ?? '', albumArtistName)
```

No JSX, adicionar prop `backUrl` ao `CollectionHeader`:
```tsx
<CollectionHeader
  imageUrl={album.data?.images?.[0]?.url}
  backUrl={backUrl}
  name={album.data?.name ?? ''}
  subtitle={albumSubtitle}
  year={albumYear}
  playLabel={t('albumDetail.playAlbum')}
  onPlay={handlePlay}
  onLayout={handleLayout}
/>
```

- [ ] **Passo 3: Rodar todos os testes e verificar**

```bash
npx vitest run
```

Esperado: todos os testes existentes PASS (CollectionHeader não tem testes próprios, os demais não devem ser afetados)

- [ ] **Passo 4: Commit**

```bash
git add src/components/shared/CollectionHeader.tsx src/pages/AlbumDetail.tsx
git commit -m "feat: integrate FlippableCover into CollectionHeader and wire useAlbumBackCover in AlbumDetail"
```

---

## Task 4: Integrar `TrackInfoPanel`

**Files:**
- Modificar: `src/components/layout/TrackInfoPanel.tsx`

- [ ] **Passo 1: Atualizar `TrackInfoPanel`**

Em `src/components/layout/TrackInfoPanel.tsx`, adicionar imports:

```tsx
import { FlippableCover } from '@/components/shared/FlippableCover'
import { useAlbumBackCover } from '@/hooks/queries/useAlbumBackCover'
```

Dentro de `TrackInfoPanel({ track })`, adicionar após as declarações de hooks existentes:

```tsx
const artistName = track.artists[0]?.name ?? ''
const { backUrl } = useAlbumBackCover(track.album.id, track.album.name, artistName)
```

Substituir o bloco `{/* Album art */}`:

```tsx
{/* Album art */}
<FlippableCover
  frontUrl={track.album.images[0]?.url}
  backUrl={backUrl}
  size={176}
  name={track.album.name}
/>
```

(O bloco removido é:)
```tsx
{/* Album art */}
<div className="relative group">
  <div className="absolute -inset-4 bg-white/5 rounded-lg blur-2xl transition-all duration-500 group-hover:bg-white/10" />
  <img
    src={track.album.images[0]?.url}
    alt={track.album.name}
    className="relative w-44 h-44 rounded-lg object-cover shadow-2xl transition-transform duration-500 group-hover:scale-105"
  />
</div>
```

- [ ] **Passo 2: Rodar todos os testes**

```bash
npx vitest run
```

Esperado: todos PASS

- [ ] **Passo 3: Commit**

```bash
git add src/components/layout/TrackInfoPanel.tsx
git commit -m "feat: integrate FlippableCover into TrackInfoPanel with back cover lookup"
```

---

## Task 5: Verificar e fechar

- [ ] **Passo 1: Build sem erros de tipo**

```bash
npx tsc --noEmit
```

Esperado: sem erros

- [ ] **Passo 2: Rodar suite completa de testes**

```bash
npx vitest run
```

Esperado: todos os testes PASS, sem regressões

- [ ] **Passo 3: Push e fechar issues no beads**

```bash
bd dolt push
git push
```
