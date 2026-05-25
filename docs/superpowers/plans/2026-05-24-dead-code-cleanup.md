# Dead Code Cleanup & Repo Organization — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover código morto confirmado e organizar documentação do repositório para apresentação em hiring challenge.

**Architecture:** Duas frentes independentes e sequenciais: (1) deletar arquivos/tipos nunca importados — verificando com `yarn build` que nenhum era usado; (2) atualizar README e CLAUDE.md para refletir o projeto real.

**Tech Stack:** TypeScript, React, Vite, TanStack Query, yarn

---

## Arquivos Modificados

| Arquivo | Ação |
|---|---|
| `src/hooks/queries/useTracks.ts` | Deletar |
| `src/hooks/queries/useNewReleases.ts` | Deletar |
| `src/hooks/queries/useRecommendations.ts` | Deletar |
| `src/hooks/queries/useUserTopItems.ts` | Deletar |
| `src/hooks/queries/useUserTopArtists.ts` | Deletar |
| `src/components/artist/RelatedArtists.tsx` | Deletar |
| `src/hooks/queries/useRelatedArtists.ts` | Deletar |
| `src/types/spotify.ts` | Remover 7 tipos órfãos |
| `README.md` | Trocar `npm run` por `yarn` |
| `CLAUDE.md` | Preencher Architecture Overview e Conventions |

---

### Tarefa 1: Deletar arquivos de hooks sem uso

**Files:**
- Delete: `src/hooks/queries/useTracks.ts`
- Delete: `src/hooks/queries/useNewReleases.ts`
- Delete: `src/hooks/queries/useRecommendations.ts`
- Delete: `src/hooks/queries/useUserTopItems.ts`
- Delete: `src/hooks/queries/useUserTopArtists.ts`

- [ ] **Step 1: Confirmar que nenhum é importado**

```bash
grep -r "useTracks\|useNewReleases\|useRecommendations\|useUserTopItems\|useUserTopArtists" src/ --include="*.ts" --include="*.tsx" | grep -v "^src/hooks/queries/use"
```

Esperado: sem output (nenhum importador).

- [ ] **Step 2: Deletar os 5 arquivos**

```bash
rm src/hooks/queries/useTracks.ts \
   src/hooks/queries/useNewReleases.ts \
   src/hooks/queries/useRecommendations.ts \
   src/hooks/queries/useUserTopItems.ts \
   src/hooks/queries/useUserTopArtists.ts
```

- [ ] **Step 3: Verificar build**

```bash
yarn build 2>&1 | tail -5
```

Esperado: `✓ built in Xs` sem erros de `Module not found`.

---

### Tarefa 2: Deletar componente e hook de artistas relacionados

**Files:**
- Delete: `src/components/artist/RelatedArtists.tsx`
- Delete: `src/hooks/queries/useRelatedArtists.ts`

- [ ] **Step 1: Confirmar que RelatedArtists não é importado em nenhuma página**

```bash
grep -r "RelatedArtists\|useRelatedArtists" src/ --include="*.tsx" --include="*.ts" | grep -v "RelatedArtists.tsx\|useRelatedArtists.ts"
```

Esperado: sem output.

- [ ] **Step 2: Deletar os arquivos**

```bash
rm src/components/artist/RelatedArtists.tsx \
   src/hooks/queries/useRelatedArtists.ts
```

- [ ] **Step 3: Verificar build e lint**

```bash
yarn build 2>&1 | tail -5 && yarn lint
```

Esperado: build ok, lint sem warnings.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove unused hooks and dead RelatedArtists component"
```

---

### Tarefa 3: Remover tipos órfãos de spotify.ts

**Files:**
- Modify: `src/types/spotify.ts`

Os seguintes tipos existem no arquivo mas nenhum é importado fora dele:
`NewReleasesResponse` (linha ~136), `RelatedArtistsResponse` (linha ~330),
`SpotifyRecommendationsResponse` (linha ~294), `AudioFeatures` (linha ~140),
`SpotifyExplicitContent` (linha ~84), `LinkedTrack` (linha ~36), `TrackRestrictions` (linha ~44).

- [ ] **Step 1: Confirmar que nenhum tipo é importado externamente**

```bash
grep -r "NewReleasesResponse\|RelatedArtistsResponse\|SpotifyRecommendationsResponse\|AudioFeatures\|SpotifyExplicitContent\|LinkedTrack\|TrackRestrictions" src/ --include="*.ts" --include="*.tsx" | grep -v "spotify.ts"
```

Esperado: sem output.

- [ ] **Step 2: Remover os 7 tipos de `src/types/spotify.ts`**

Localizar e deletar cada bloco de interface/type. Referência de localização (verificar linha exata antes de editar):

- `export interface LinkedTrack { ... }` — apagar o bloco inteiro
- `export interface TrackRestrictions { ... }` — apagar o bloco inteiro
- `export interface SpotifyExplicitContent { ... }` — apagar o bloco inteiro
- `export interface NewReleasesResponse { ... }` — apagar o bloco inteiro
- `export interface AudioFeatures { ... }` — apagar o bloco inteiro (bloco grande, ~20 linhas)
- `export interface SpotifyRecommendationsResponse { ... }` — apagar o bloco inteiro
- `export interface RelatedArtistsResponse { ... }` — apagar o bloco inteiro

- [ ] **Step 3: Verificar build (garante que nenhum tipo removido era usado)**

```bash
yarn build 2>&1 | tail -5
```

Esperado: build ok sem erros de tipo.

- [ ] **Step 4: Verificar lint**

```bash
yarn lint
```

Esperado: `Done` sem warnings.

- [ ] **Step 5: Commit**

```bash
git add src/types/spotify.ts
git commit -m "refactor: remove orphaned TypeScript type definitions from spotify.ts"
```

---

### Tarefa 4: Corrigir README.md (npm run → yarn)

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Identificar todas as ocorrências de `npm run` e `npm`**

```bash
grep -n "npm" README.md
```

- [ ] **Step 2: Substituir comandos npm por yarn**

Substituições a fazer no README.md:

| De | Para |
|---|---|
| `npm install` | `yarn` |
| `npm run dev` | `yarn dev` |
| `npm run build` | `yarn build` |
| `npm run lint` | `yarn lint` |
| `npm test` | `yarn test` |
| `npm run test:e2e` | `yarn test:e2e` |
| `# ou` / `# ou` antes de `yarn` | remover as linhas `# ou\nyarn` redundantes — manter só `yarn` |
| `npx playwright install` | manter (não há equivalente yarn para isso) |
| `npx playwright test --ui` | manter |

- [ ] **Step 3: Confirmar que não sobrou `npm run`**

```bash
grep "npm run\|npm install" README.md
```

Esperado: sem output.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: standardize README commands to use yarn"
```

---

### Tarefa 5: Preencher CLAUDE.md com arquitetura real

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Substituir a seção `## Architecture Overview` pelo conteúdo real**

Localizar `_Add brief overview of your project architecture_` e substituir por:

```markdown
## Architecture Overview

SPA React com autenticação PKCE OAuth2 contra a API do Spotify. O estado global é dividido em três contextos:
- **AuthContext** (`src/contexts/AuthContext.tsx`) — tokens, perfil, fluxo de login/logout
- **PlayerContext** (`src/contexts/PlayerContext.tsx`) — faixa atual, progresso, sincronização com a API de player do Spotify
- **UIContext** (`src/contexts/UIContext.tsx`) — estado do menu hambúrguer e preferências de idioma

Dados remotos são gerenciados por **TanStack Query** com hooks por recurso em `src/hooks/queries/`.
Mutações (criar/editar playlist, favoritos) ficam em `src/hooks/mutations/`.
Hooks de página (ex: `useArtistDetailPage`, `useAlbumDetailPage`) orquestram múltiplas queries e lógica de UI, mantendo as páginas declarativas.

Roteamento via **React Router v6** com lazy loading em todas as páginas (`src/utils/lazyWithRetry.ts`).
Autenticação protege todas as rotas exceto `/login`, `/callback` e `/auth-error`.
```

- [ ] **Step 2: Substituir a seção `## Conventions & Patterns` pelo conteúdo real**

Localizar `_Add your project-specific conventions here_` e substituir por:

```markdown
## Conventions & Patterns

- **Hooks de query:** um arquivo por recurso em `src/hooks/queries/`. Cada hook encapsula `queryKey`, `staleTime`, tratamento de erro 403 (retorna `[]` em vez de lançar) e retry via `queryClient`.
- **Hooks de página:** arquivos `src/hooks/use<Page>Page.ts` agregam queries e lógica de navegação para uma página específica, mantendo os componentes de página limpos.
- **Tipos Spotify:** centralizados em `src/types/spotify.ts`. Não duplicar tipos — referenciar sempre deste arquivo.
- **Utilitários:** `src/lib/` para integrações (axios, queryClient, i18n, PKCE); `src/utils/` para funções puras (formatação, parsing).
- **Componentes UI:** primitivos reutilizáveis em `src/components/ui/`; componentes de domínio em `src/components/shared/`, `src/components/artist/`, etc.
- **Testes:** Vitest + Testing Library para unitários/componentes; Playwright para E2E com mocks MSW. Rodar com `yarn test` e `yarn test:e2e`.
```

- [ ] **Step 3: Verificar que os placeholders foram removidos**

```bash
grep "_Add" CLAUDE.md
```

Esperado: sem output.

- [ ] **Step 4: Commit final e push**

```bash
git add CLAUDE.md docs/superpowers/
git commit -m "docs: fill architecture overview and conventions in CLAUDE.md"
git pull --rebase && git push
```

---

## Verificação Final

```bash
yarn lint && yarn build && echo "TUDO OK"
```

Esperado: `TUDO OK` sem erros ou warnings.
