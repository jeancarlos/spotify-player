# Spoter — Redesign Completo

**Data:** 2026-05-22  
**Status:** Aprovado pelo usuário

---

## 1. Contexto e objetivo

Redesign completo do Spoter para fidelidade ao wireframe aprovado:
disco de vinil como elemento visual central, cards em arco, fundo branco, frosted glass nos elementos flutuantes.

A camada de dados (contexts, hooks de query, axios, pkce, i18n) é 100% reutilizada.
O rebuild é cirúrgico: apenas `pages/`, `components/` e `styles/` são recriados.

---

## 2. Requisitos funcionais

### Obrigatórios (disciplina)
- Demo funcional com requisições Spotify funcionando
- Listagem de artistas paginada (20/página), sem tabela
- Filtro por nome de artista e por álbum
- Página de detalhe do artista: top tracks + discografia paginada
- Tabela paginada de músicas/álbuns na página de detalhe
- Tradução PT-BR / EN-US (i18next, já existente)
- Gráfico(s) — popularidade e/ou audio features via recharts
- Formulário de favoritos com validação (React Hook Form + Zod), persistido no localStorage como fallback

### Diferenciais implementados
- Animações e vinil girando com framer-motion
- Layout em arco real (cards posicionados via CSS transform)
- Scroll-triggered transition: Login → Dashboard
- Frosted glass em menus e player
- Integração com Spotify Playlist API ("Spoter List")
- Botão ♥ nos TrackCards para adicionar/remover da playlist
- Queue list dinâmica no PlayerView

---

## 3. Requisitos técnicos (todos atendidos)

| Tech | Status |
|---|---|
| React 19 | ✅ existente |
| TypeScript | ✅ existente |
| Context API + useReducer | ✅ AuthContext, PlayerContext, UIContext |
| React Query | ✅ @tanstack/react-query v5 |
| Axios | ✅ lib/axios.ts com interceptors |
| Tailwind CSS | ✅ existente |
| React Hook Form + Zod | ✅ existente |
| i18n PT-BR / EN-US | ✅ existente |
| README | ✅ a escrever pelo usuário |

---

## 4. Estratégia de migração: Big Bang

**Fica intacto (não tocar):**
```
src/lib/           axios.ts, pkce.ts, i18n.ts, queryClient.ts, utils.ts, colorThief.ts
src/contexts/      AuthContext, PlayerContext, UIContext + reducers + tests
src/hooks/         todos os 12 query hooks + useAuth, usePlayer, useFavorites, useDebounce, useUI
src/types/         spotify.ts, favorites.ts
src/locales/       pt-BR.json, en-US.json  (recebe novas chaves)
src/pages/         OAuthCallback.tsx
src/components/layout/   ProtectedRoute.tsx, PlayerSync.tsx, QueryErrorHandler.tsx
src/mocks/         handlers.ts, server.ts
src/test-setup.ts
```

**Deletar:**
```
src/styles/glass.css
src/components/layout/DynamicBackground.tsx
src/assets/hero.png, react.svg, vite.svg
src/components/ui/badge.tsx
src/index.css  (substituído por novo)
```

**Reconstruir do zero:**
```
src/index.css
src/styles/globals.css
src/router.tsx                           (adiciona /player)
src/components/vinyl/                    (novo)
src/components/layout/AppShell.tsx
src/components/layout/HamburgerMenu.tsx
src/components/layout/MiniPlayer.tsx
src/components/layout/PlayerView.tsx     (substituiu FullscreenPlayer)
src/components/shared/*                  (novo design system)
src/pages/Login.tsx
src/pages/Home.tsx
src/pages/Artists.tsx
src/pages/ArtistDetail.tsx
src/pages/Favorites.tsx
src/pages/Profile.tsx
```

---

## 5. Arquitetura de rotas

```
/login          Login (não protegido)
/callback       OAuthCallback (não protegido)
/               AppShell (ProtectedRoute)   ← renderiza MiniPlayer
  /             Home — dashboard com ArcCarousel
  /artists      Artists — lista paginada
  /artists/:id  ArtistDetail — top tracks arc + discografia + charts
  /favorites    Favorites — Spoter List (vertical)
/player         PlayerView (ProtectedRoute separado, sem AppShell/MiniPlayer)
```

`/player` fica fora do AppShell para não herdar o MiniPlayer. Tem seu próprio `<ProtectedRoute>` wrapper.

---

## 6. Design system

### Tokens visuais
```css
/* Fundo */
background: #ffffff;

/* Frosted glass — copiado de ~/financas */
.glass        backdrop-filter: blur(20px), bg rgba(255,255,255,0.7)
.glass-card   backdrop-filter: blur(24px), bg rgba(255,255,255,0.65), border-radius 1.25rem

/* Vinyl */
src/assets/vinyl.webp   800×800px, 28KB, disco preto com label rosa
```

### Componentes novos

#### `src/components/vinyl/VinylDisk.tsx`
- Renderiza `vinyl.webp` como `<img>` em um `<div>` circular
- Prop `isPlaying: boolean` → framer-motion `animate={{ rotate: 360 }}` infinite quando true
- Prop `albumArt?: string` → sobrepõe imagem no label rosa central (circle clip)
- Prop `size?: 'sm' | 'md' | 'lg'` → 200/400/600px

#### `src/components/vinyl/ArcCarousel.tsx`
- Recebe `items: ReactNode[]` e `radius: number`
- Posiciona cada item com `transform: rotate(angle) translateY(-radius) rotate(-angle)`
- Ângulo distribuído em semicírculo (180°) ou arco personalizado
- Prop `offset: number` → state para rotação (seta ← → incrementa/decrementa)
- Animação via framer-motion `AnimatePresence`

#### `src/components/layout/HamburgerMenu.tsx`
- Botão `≡` fixo `top-4 left-4 z-50`
- Overlay `AnimatePresence` desliza da esquerda: `x: -300 → 0`
- Conteúdo: avatar + username, link Favoritos, toggle PT/EN, botão Sair
- Fundo: `.glass` (frosted glass)

#### `src/components/layout/MiniPlayer.tsx` (rebuild)
- Barra `fixed bottom-0` com `.glass` 
- Capa do álbum (40×40), título + artista, controles (prev/play/next), volume
- Link para `/player` ao clicar no título
- Oculto na rota `/player`

#### `src/components/layout/PlayerView.tsx`
- Rota `/player` (sem AppShell MiniPlayer)
- Background: album art com `blur(40px)` + overlay semitransparente
- Letras (`useLyrics`) centralizadas, linha atual em bold
- Controles player
- Queue list lateral: `.glass-card`, lista dinâmica, resize automático
- Botão ← volta para rota anterior (`navigate(-1)`)

#### `src/components/shared/VinylCard.tsx`
- Substitui TrackCard + AlbumCard
- `.glass-card` com capa quadrada
- Hover: translateY(-2px)
- Botão ♥ overlay para adicionar à "Spoter List"

---

## 7. Páginas

### Login
- Fundo `bg-white`
- `VinylDisk size="lg"` centralizado, rotação lenta idle (10s/volta)
- "Spoter" h1 acima
- Botão "Entrar com Spotify" (#1DB954)
- Ao autenticar: framer-motion `y: 0 → -100vh` no disco, AppShell entrada

### Home (`/`)
- VinylDisk decorativo no centro-bottom como fundo
- `ArcCarousel` com músicas recentes (useRecentlyPlayed) em semicírculo
- SearchBar + tabs (artista/álbum/playlist) → navigate('/artists?q=...')
- HamburgerMenu (botão fixo)
- MiniPlayer bottom

### Artists (`/artists`)
- SearchBar com tabs
- Filtro por artista (useArtists) ou álbum (useSearchAlbums)
- Grid 4-col, 20 itens/página, Pagination prev/next
- HamburgerMenu, MiniPlayer

### ArtistDetail (`/artists/:id`)
- Nome artista grande, `useArtist` para dados
- `ArcCarousel` com top 5 tracks numerados (useArtistTopTracks)
- Label "Mais ouvidas"
- Tabela paginada de álbuns (useArtistAlbums) com Pagination
- Recharts: gráfico de popularidade (barra) e/ou audio features (radar) via useAudioFeatures
- MiniPlayer bottom

### Favorites (`/favorites`)
- `useSpoterPlaylist` hook gerencia "Spoter List":
  - Busca em `GET /me/playlists`, filtra por nome
  - Se não existe: `POST /users/{id}/playlists` com nome "Spoter List"
  - Fallback: localStorage `spoter_playlist` se API falhar
- Lista vertical de tracks da playlist
- Botão ♥/🗑 em cada track para remover
- Formulário "Adicionar música" (React Hook Form + Zod): campos título + artista → dispara `GET /search?type=track` ao submeter
  - Resultados encontrados: exibe lista para o usuário selecionar → adiciona à Spoter List
  - Nenhum resultado: erro visual inline ("Nenhuma música encontrada no Spotify")
  - Fallback offline: se API indisponível, salva no localStorage com dados do form
- HamburgerMenu, MiniPlayer

### PlayerView (`/player`)
- Ver item 6 (componente)

---

## 8. Novos hooks necessários

```typescript
// Playlist "Spoter List"
src/hooks/queries/useUserPlaylists.ts     GET /me/playlists
src/hooks/queries/usePlaylistTracks.ts    GET /playlists/{id}/tracks
src/hooks/mutations/useCreatePlaylist.ts  POST /users/{id}/playlists
src/hooks/mutations/useAddToPlaylist.ts   POST /playlists/{id}/tracks
src/hooks/mutations/useRemoveFromPlaylist.ts DELETE /playlists/{id}/tracks

// Composição
src/hooks/useSpoterPlaylist.ts   orquestra os hooks acima + fallback localStorage
```

---

## 9. Scopes OAuth extras

```
playlist-modify-private
playlist-modify-public
```
Adicionar em `src/contexts/AuthContext.tsx` array `SCOPES`.

---

## 10. Asset

```
src/assets/vinyl.webp   800×800, 28KB
```
Não usar `vinil.jpg` (original 478KB, resolução excessiva para web).

---

## 11. i18n — novas chaves necessárias

```json
"favorites": {
  "spoterList": "Spoter List",
  "addManually": "Adicionar manualmente",
  "noTracks": "Nenhuma música na lista",
  "removeTrack": "Remover da lista"
},
"player": {
  "queue": "Próximas",
  "lyrics": "Letra"
}
```

---

## 12. O que NÃO está no escopo

- Testes E2E (playwright) — já existe plano separado `2026-05-22-e2e-tests.md`
- Dark mode — fundo branco fixo
- PWA / offline completo
- Animação de scroll real da Login→Home (framer-motion transition é suficiente)
