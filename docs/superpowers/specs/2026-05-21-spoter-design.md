# Spoter — Design Spec

**Data:** 2026-05-21
**Status:** Aprovado

## Visão Geral

Spoter é um Spotify client web com foco em **imersão cinematic** e **curadoria pessoal**. O diferencial está na experiência de escuta — background dinâmico extraído do album art, player expansível fullscreen com lyrics, e um espaço pessoal de favoritos — tudo sobre uma estética glassmorphism/liquid-glass com grain texture dark.

---

## Stack Técnico

| Categoria | Tecnologia |
|---|---|
| Framework | React 18 + TypeScript |
| Roteamento | React Router v6 |
| Estado global | Context API + useReducer |
| Data fetching | React Query + Axios |
| Formulários | React Hook Form + Zod |
| Estilo | Tailwind CSS |
| Componentes | Shadcn/UI (customizado para glass) |
| Ícones | Lucide Icons |
| Gráficos | Recharts |
| Animações | Framer Motion |
| Extração de cor | color-thief-ts |
| Tipografia | JetBrains Mono (UI principal) + Inter (lyrics/texto longo) |
| i18n | react-i18next (pt-BR + en-US) |
| Linting | ESLint + Prettier |
| Testes unitários | Vitest + Testing Library |
| Testes E2E | Playwright |

---

## Arquitetura

### Shell Layout

```
AppShell
├── <Sidebar>            — nav esquerda collapsível, hover mostra profile popup
├── <main>               — <Outlet> das rotas filhas
├── <MiniPlayer>         — barra bottom persistente em todas as rotas
└── <FullscreenPlayer>   — overlay expansível do MiniPlayer
```

### Rotas

```
/login                   → OAuth PKCE callback
/ (shell protegido)
  /                      → Home: recently played, new releases, recomendações
  /artists               → Listagem paginada + busca + filtro por gênero
  /artists/:id           → Detalhe do artista
  /profile               → Perfil do usuário + gráficos
  /favorites             → Formulário + lista de favoritos
```

### Auth

- Flow: **PKCE** (Authorization Code with PKCE)
- `access_token` → `sessionStorage`
- `refresh_token` → `localStorage`
- Axios interceptor renova token automaticamente antes de expirar

**Scopes necessários:**
```
user-read-private user-read-email
user-top-read user-read-recently-played
user-library-read user-follow-read
user-read-playback-state user-modify-playback-state
streaming playlist-read-private
```

---

## State Management

### PlayerContext

```typescript
state: {
  currentTrack: Track | null
  queue: Track[]
  isPlaying: boolean
  isLoading: boolean
  progress: number        // ms
  duration: number        // ms
  volume: number          // 0-1
  shuffle: boolean
  repeat: 'off' | 'track' | 'context'
  isFullscreen: boolean
  palette: [string, string] | null  // cores extraídas do album art
}
```

### AuthContext

```typescript
state: {
  accessToken: string | null
  refreshToken: string | null
  profile: SpotifyUser | null
  isAuthenticated: boolean
}
```

### UIContext

```typescript
state: {
  language: 'pt-BR' | 'en-US'
  sidebarCollapsed: boolean
}
```

---

## Data Layer

### Queries React Query

| Hook | Endpoint Spotify |
|---|---|
| `useArtists(query, page)` | `GET /search?type=artist` |
| `useArtist(id)` | `GET /artists/:id` |
| `useArtistTopTracks(id)` | `GET /artists/:id/top-tracks` |
| `useArtistAlbums(id, page)` | `GET /artists/:id/albums` |
| `useUserProfile()` | `GET /me` |
| `useUserTopItems(type, range)` | `GET /me/top/{tracks\|artists}` |
| `useRecentlyPlayed()` | `GET /me/player/recently-played` |
| `useRecommendations(seeds)` | `GET /recommendations` |
| `useAudioFeatures(trackId)` | `GET /audio-features/:id` |
| `useNowPlaying()` | `GET /me/player` (polling 5s) |
| `useLyrics(artist, title)` | `lyrics.ovh` (fallback: null → metadata) |

### Favorites (LocalStorage)

Hook `useFavorites` com `useReducer` interno. Sem React Query — lê/escreve direto no `localStorage`. Schema validado por Zod:

```typescript
FavoriteTrack: {
  id: string          // uuid gerado no client
  title: string       // obrigatório
  artist: string      // obrigatório
  album?: string
  note?: string
  createdAt: string   // ISO date
}
```

---

## Design System

### Tipografia

| Fonte | Uso | Peso |
|---|---|---|
| JetBrains Mono | UI geral — labels, navegação, metadados, números | Regular (400), Bold (700) para destaques |
| Inter | Lyrics, blocos de texto longo, bio de artistas | Regular (400), Medium (500) |

Carregadas via Google Fonts. Definidas como CSS vars e mapeadas no Tailwind:
- `font-mono` → JetBrains Mono (padrão do app)
- `font-sans` → Inter (texto longo/lyrics)

---

### Glassmorphism Base

Classes utilitárias em `src/styles/glass.css`:

```css
.glass-card    → bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl
.glass-card-md → bg-white/8 backdrop-blur-md border border-white/10 rounded-xl
.glass-input   → glass-card ring-white/20 focus:ring-white/40 transition
```

### Background Dinâmico

Fluxo ao trocar de faixa:
1. Album art carrega → `color-thief-ts` extrai 2 cores dominantes
2. `PlayerContext` dispara `SET_PALETTE`
3. `AppShell` aplica `--color-primary` e `--color-secondary` como CSS vars
4. Framer Motion anima cross-fade entre paletas (800ms ease)

**Estados do background:**
- **Idle:** pulso suave lento (~8s) em dark purple/slate neutro + grain texture
- **Playing:** gradiente radial vivo com as cores da paleta + animação de ondas suave
- **Transition:** cross-fade entre paletas ao trocar faixa

Grain texture: `noise.svg` como pseudo-element `::before` fixo, opacity ~0.04.

### i18n

`react-i18next` com arquivos `src/locales/pt-BR.json` e `src/locales/en-US.json`. Toggle na Sidebar. Idioma persiste em `localStorage`.

---

## Features por Página

### Home `/`

- Cards: Recently Played, New Releases (Spotify Browse API), Recomendações baseadas nos top artists do usuário
- Hover nos cards: scale(1.02) + glow sutil
- Layout: seções horizontais com scroll, cada uma com título e "ver mais"

### Artists `/artists`

- Grid responsivo, paginação numérica, 20 artistas/página
- Busca por nome de artista (campo principal)
- Busca por álbum (modo toggle — altera o tipo de search)
- Filtro extra: por gênero (chip pills filtráveis)
- Card do artista: foto, nome, gêneros, followers, botão play

### Artist Detail `/artists/:id`

- Hero: foto grande do artista, nome, genres, followers, popularity bar
- Toggle tabs: **Top Tracks** | **Álbuns**
- Tabela paginada (10/page): #, capa, título, duração, popularidade
- Cada linha: hover reveal com botão play
- Botão play → envia para `PlayerContext` (track + contexto do artista)

### Fullscreen Player

- Background: dynamic palette + album art blurred atrás
- Album art centralizado com sombra de glow
- Controls: prev / play-pause / next + shuffle + repeat + volume slider
- Progress bar: seek interativo, tempo atual / duração
- Toggle Lyrics: chama `useLyrics`, exibe letra; se null → mostra metadados da faixa (álbum, release date, popularidade)
- Playlist/queue: painel lateral deslizante (wireframe `player-expanded`)
- Botão minimizar: colapsa de volta para MiniPlayer

### Profile `/profile`

- Avatar, nome, email, plano Spotify, followers/following
- **Radar chart (Recharts):** média das audio features do top 5 tracks — danceability, energy, valence, acousticness, speechiness (normalizado 0-1)
- **Bar chart (Recharts):** top artists por período — toggle: 4 semanas | 6 meses | longo prazo
- Lista: álbuns mais escutados (inferidos dos top tracks agrupados por álbum) com contador de faixas

### Favorites `/favorites`

- Form (React Hook Form + Zod): título* , artista*, álbum, nota pessoal
- Validação inline: border vermelho + mensagem de erro abaixo do campo
- Submit: salva no `localStorage` via `useFavorites`
- Lista abaixo do form com cards glassmorphism dos favoritos salvos
- Busca local nos favoritos (filtra em tempo real)
- Botão remover em cada card com confirmação inline

---

## Testes

### Unitários (Vitest + Testing Library)

- Reducers: todos os `case` de `playerReducer`, `authReducer`, `uiReducer`
- Hooks: `useFavorites` (add/remove/search), `usePlayer`, `useAuth`
- Components: `FavoritesForm` (validações), `MiniPlayer` (controls), `LanguageToggle`
- Utils: `colorExtractor`, formatadores de tempo/duração

### E2E (Playwright)

- Login flow completo com mock OAuth
- Buscar artista → entrar no detalhe → play track → verificar MiniPlayer
- Abrir fullscreen player → toggle lyrics
- Adicionar favorito → validar localStorage → remover
- Trocar idioma → verificar strings PT-BR e EN-US
- Paginação na listagem de artistas

---

## Estrutura de Diretórios

```
src/
├── assets/              — imagens, noise.svg, fontes
├── components/
│   ├── ui/              — componentes Shadcn customizados (glass variants)
│   ├── layout/          — AppShell, Sidebar, MiniPlayer, FullscreenPlayer
│   └── shared/          — GlassCard, TrackRow, ArtistCard, etc.
├── contexts/            — PlayerContext, AuthContext, UIContext
├── hooks/               — usePlayer, useAuth, useUI, useFavorites, queries/*
├── lib/                 — axios instance, queryClient, colorThief util
├── locales/             — pt-BR.json, en-US.json
├── pages/               — Home, Artists, ArtistDetail, Profile, Favorites, Login
├── styles/              — glass.css, globals.css
├── types/               — spotify.ts, favorites.ts
└── utils/               — formatDuration, formatNumber, etc.
```

---

## Convenções de Desenvolvimento

- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `style:`, `test:`, `docs:`)
- **Branches:** feature branch por funcionalidade (`feat/player-fullscreen`, `feat/artists-listing`)
- **Primeiro commit:** infra inicial (Vite + React + TS + Tailwind + ESLint + Prettier configurados)
- **CLAUDE.md:** arquivo na raiz descrevendo stack, design system, padrões de código e dock de design para uso da IA
