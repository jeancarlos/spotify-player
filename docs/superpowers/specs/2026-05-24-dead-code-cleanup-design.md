# Design: Limpeza de Código Morto e Organização do Repositório

**Data:** 2026-05-24
**Contexto:** Hiring challenge — repositório precisa estar apresentável para avaliador brasileiro.

## Escopo

Duas frentes independentes: remoção de código não utilizado e organização de documentação.

## 1. Remoção de Código Morto

### Arquivos a deletar (7)

| Arquivo | Motivo |
|---|---|
| `src/hooks/queries/useTracks.ts` | 0 importações |
| `src/hooks/queries/useNewReleases.ts` | 0 importações |
| `src/hooks/queries/useRecommendations.ts` | 0 importações |
| `src/hooks/queries/useUserTopItems.ts` | 0 importações (duplicata de `useUserTopArtists`) |
| `src/hooks/queries/useUserTopArtists.ts` | 0 importações |
| `src/components/artist/RelatedArtists.tsx` | removido da página, arquivo ficou esquecido |
| `src/hooks/queries/useRelatedArtists.ts` | único consumidor era `RelatedArtists.tsx` |

### Tipos a remover de `src/types/spotify.ts` (7)

`NewReleasesResponse`, `RelatedArtistsResponse`, `SpotifyRecommendationsResponse`,
`AudioFeatures`, `SpotifyExplicitContent`, `LinkedTrack`, `TrackRestrictions`

Nenhum desses tipos é importado fora de `spotify.ts`. Os dois primeiros eram usados
apenas pelos hooks mortos acima.

### Verificação

Após as remoções: `yarn build` deve passar sem erros.

## 2. Organização do Repositório

### README.md

- Substituir `npm run` por `yarn` nos comandos dos scripts (alinha com `package.json`)
- Conteúdo e idioma (pt-BR) permanecem — correto para avaliador brasileiro

### CLAUDE.md

- Preencher a seção `## Architecture Overview` com descrição real da arquitetura do projeto
- Preencher a seção `## Conventions & Patterns` com padrões de código utilizados

## Critérios de Aceitação

- `yarn build` e `yarn lint` passam sem warnings
- Nenhum dos 7 arquivos deletados aparece em `git status`
- `import` de qualquer tipo removido → erro de compilação (ou seja, nenhum estava sendo usado)
- README usa `yarn` consistentemente
- CLAUDE.md tem architecture overview não-genérico
