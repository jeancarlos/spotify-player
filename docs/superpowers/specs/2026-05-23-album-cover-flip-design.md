# Album Cover Flip — Design Spec
Data: 2026-05-23

## Objetivo

Adicionar animação de flip 3D suave nas capas de álbum no `AlbumDetail` e no `TrackInfoPanel` (tela de detalhes da música), usando a imagem de verso do Cover Art Archive quando disponível. Melhorar o tilt existente para simular um objeto físico vindo em direção ao usuário.

---

## Escopo

**Componentes afetados:**
- `src/components/shared/CollectionHeader.tsx` — capa do álbum
- `src/components/layout/TrackInfoPanel.tsx` — capa da música tocando

**Novos arquivos:**
- `src/hooks/queries/useAlbumBackCover.ts` — busca back cover via MusicBrainz + CAA
- `src/components/shared/FlippableCover.tsx` — componente de capa com flip/tilt

---

## Comportamento

| Situação | Animação |
|---|---|
| Álbum tem back cover no CAA | Hover → flip Y 180° suave (~0.7s), tilt funciona em ambos os lados |
| Álbum sem back cover | Hover → só tilt melhorado (sem flip) |

**Tilt melhorado (ambos os casos):**
- `translateY: +24px` (desce, cobre parcialmente o nome do álbum)
- `scale: 1.06` (simula objeto vindo em direção ao usuário)
- `rotateX / rotateY` com springs mantidos
- `zIndex` elevado no hover para sobrepor o texto abaixo

---

## Hook `useAlbumBackCover`

**Assinatura:**
```ts
function useAlbumBackCover(
  albumId: string | undefined,
  albumName: string,
  artistName: string
): { backUrl: string | null; loading: boolean }
```

**Fluxo:**
1. Checa `localStorage` key `caa:{albumId}` — retorna imediato se cacheado
2. Busca MusicBrainz: `GET https://musicbrainz.org/ws/2/release/?query=release:"{albumName}"+artistname:"{artistName}"&limit=1&fmt=json`
3. Extrai `releases[0].id` (mbid)
4. Busca CAA: `GET https://coverartarchive.org/release/{mbid}`
5. Filtra `images` onde `types` inclui `"Back"`, pega `thumbnails.large` ou `image`
6. Salva em localStorage (`null` se não achar — evita requery)
7. Retorna `{ backUrl, loading }`

**Edge cases:**
- `albumId` undefined → retorna `{ backUrl: null, loading: false }` imediato
- MusicBrainz não acha → `backUrl: null`, cacheia `null`
- CAA retorna 404 → `backUrl: null`, cacheia `null`
- Rate limit: MusicBrainz pede 1 req/s — hook só dispara uma vez por álbum (cache previne requery)

---

## Componente `FlippableCover`

**Assinatura:**
```ts
interface FlippableCoverProps {
  frontUrl?: string
  backUrl?: string | null
  size: number
  name?: string
  onClick?: () => void
  className?: string
}
```

**Estrutura DOM (flip mode):**
```
div[perspective: 1200px]
  motion.div[transformStyle: preserve-3d, rotateY: 0→180 no hover]
    div[face: front, backfaceVisibility: hidden]  ← frontUrl
    div[face: back,  backfaceVisibility: hidden, rotateY: 180]  ← backUrl
```

**Tilt:** aplicado no `motion.div` externo via `rotateX/rotateY` springs + `translateY/scale` no hover. Funciona igual em frente e verso porque o flip é só rotação Y do container — o tilt age por cima.

**Modo tilt-only** (sem `backUrl`): sem o container de flip, só o motion.div com tilt. Mantém a lógica atual do `CollectionHeader`.

**Transição flip:** `transition: { rotateY: { duration: 0.7, ease: [0.4, 0, 0.2, 1] } }`

---

## Integração

### CollectionHeader
- Recebe novos props: `backUrl?: string | null`
- Substitui o `<motion.button>` interno pelo `FlippableCover`
- `AlbumDetail` chama `useAlbumBackCover` e passa `backUrl` pro `CollectionHeader`

### TrackInfoPanel
- Chama `useAlbumBackCover(track.album.id, track.album.name, artistName)`
- Substitui o `<img>` + wrapper por `FlippableCover` (tamanho `w-44 h-44`)

---

## Não está no escopo
- VinylDisk / PersistentVinylDisk — sem mudanças
- MiniPlayer — sem mudanças
- Sleeve texture — descartado
- Playlist / Artist covers — fora do escopo
