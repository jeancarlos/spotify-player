# Design: Redesign ArtistDetail + novas telas AlbumDetail e PlaylistDetail

Data: 2026-05-23

## Contexto

Refatoração da tela `/artists/:id` e criação das telas `/albums/:id` e `/playlists/:id`. Atualmente clicar em um álbum na tela do artista dispara `playContext` diretamente; o novo fluxo abre a tela do álbum/playlist antes de tocar. O `VinylDisk` girando na tela do artista é substituído por foto do artista com nome em arco SVG.

---

## Abordagem

**Opção B escolhida**: páginas separadas (`ArtistDetail`, `AlbumDetail`, `PlaylistDetail`) que compõem sub-componentes compartilhados. Evita prop-drilling de uma base comum dado que as três páginas divergem significativamente (bio + related artists no artista, charts no álbum, sem charts na playlist).

---

## Novas rotas

```
/albums/:id      → AlbumDetail
/playlists/:id   → PlaylistDetail
```

Ambas adicionadas em `src/router.tsx` dentro do `AppShell` protegido.

---

## Navegação inteligente

Todas as navegações para artista/álbum/playlist passam `state: { from: location.pathname }`.
Botões de voltar leem `location.state?.from` com fallback:
- ArtistDetail: fallback `/artists`
- AlbumDetail: fallback `/artists` (ou de onde veio)
- PlaylistDetail: fallback `/`

---

## Novos hooks

| Hook | Endpoint | Notas |
|---|---|---|
| `useAlbum(id)` | `GET /albums/{id}` | Álbum completo com label, copyrights |
| `useAlbumTracks(id, page, limit=20)` | `GET /albums/{id}/tracks` | Paginado |
| `usePlaylist(id)` | `GET /playlists/{id}` | Playlist completa |
| `useRelatedArtists(id)` | `GET /artists/{id}/related-artists` | Máx 20 da API |
| `useArtistBio(name)` | Wikipedia REST API | Search + extract, sem auth |

`usePlaylistTracks` existente é reutilizado com suporte a página (atualmente hardcoded `limit:50` — ajustar para aceitar `page` e `limit`).

---

## Novos tipos (`src/types/spotify.ts`)

```ts
SpotifyAlbumFull      // álbum completo: label, copyrights, total_tracks, genres
SpotifyAlbumTrack     // faixa de álbum: sem campo album aninhado
RelatedArtistsResponse // { artists: SpotifyArtist[] }
```

---

## Componentes compartilhados

### `ListTableSwitch`
Toggle controlled `view: 'list' | 'table'` com `onChange`. Reutilizado nas três páginas.

### `TrackTable`
Tabela com `overflow-x-auto`, sem colunas sticky — tudo scrolla junto.

**Colunas para faixas**:
`#` · capa · nome · artista · álbum (omitido em AlbumDetail) · duração · popularidade · BPM · tonalidade · explicit

**Colunas para discografia**:
capa · nome · tipo · ano · nº faixas · popularidade

Cada linha é clicável.

### `CollectionHeader`
Header compartilhado álbum/playlist:
- Imagem saindo ~25% acima do viewport (estática, sem girar)
- Nome com fonte **Inter**
- Subtítulo: artista (álbum) ou dono (playlist) + ano
- Botão destacado "Tocar álbum" / "Tocar playlist" → `playContext(uri)`

### `MusicalProfileCharts`
Extrai radar + feature bars do `TrackInfoPanel` existente.
- Entrada: `features: AudioFeatures` (média pré-calculada externamente)
- Prop `theme: 'light' | 'dark'` — dark é o estilo atual do player, light para artista/álbum
- Usa `recharts` já instalado

### `ArtistHeroSection`
Encapsula toda a lógica de `useArtistLayout` + visual zone do ArtistDetail atual:
- Foto circular do artista (substitui `VinylDisk`)
- Nome em `textPath` SVG seguindo o arco inferior da foto (reutiliza infra do `ArcCarousel`)
- Botão `←` na extremidade esquerda do arco, seguindo a curvatura
- Retorna `fixedZoneHeight` para o conteúdo scrollável saber onde começar

### `RelatedArtists`
- Cards iguais ao `ArtistCard` da busca
- 7 cards iniciais, `IntersectionObserver` carrega mais até o limite de 20
- Navega para `/artists/:id` passando `{ from: location.pathname }`

### `ArtistBio`
- `useArtistBio(name)` busca Wikipedia REST API (`/api/rest_v1/page/summary/{title}`)
- Exibe campo `extract` retornado pela API (já é um texto contínuo, não paragrafado)
- Truncar em ~500 caracteres com "..." se muito longo
- Seção completamente oculta se a resposta for vazia ou erro

---

## ArtistDetail refatorado

### Hero
- `ArtistHeroSection` substitui o bloco `VinylDisk` + posicionamento manual atual
- Foto circular do artista saindo ~30% acima do viewport
- Nome em arco SVG (mesma `textPath` do `ArcCarousel`, com estilo de título)
- Botão voltar curvo na extremidade esquerda do arco

### Carrossel (sem mudanças estruturais)
- Top 5 mais tocadas em `ArcCarousel` invertido (já existente)
- Abaixo do carrossel: lista numerada 01–05 com rank, nome, artista, álbum
- Clicar em qualquer faixa → `playContext(artist.uri)` (radio do artista)

### Discografia
- `ListTableSwitch` + lista atual (10/página) OU `TrackTable` com colunas de álbum
- Clicar em álbum/single → `navigate('/albums/:id', { state: { from } })`
- **Não** inicia reprodução diretamente

### Bio do artista
- `ArtistBio` após discografia
- Oculta se sem dados

### Perfil musical
- `MusicalProfileCharts` com média das `useArtistTopTracks` (top tracks já carregadas)
- Tema light

### Related Artists
- `RelatedArtists` abaixo do perfil musical

---

## AlbumDetail (`/albums/:id`)

1. `CollectionHeader` com capa do álbum
2. `ListTableSwitch` + `TrackRow` (lista, 20/página) OU `TrackTable` (tabela, 20/página)
3. `MusicalProfileCharts` — média das audio features das faixas da **página atual** (tema light); o componente só renderiza quando `useAudioFeatures` retorna dados
4. Botão `←` lê `location.state?.from`

---

## PlaylistDetail (`/playlists/:id`)

1. `CollectionHeader` com capa da playlist (mostra dono em vez de artista)
2. `ListTableSwitch` + `TrackRow` (lista, 20/página) OU `TrackTable` (tabela, 20/página)
3. Sem `MusicalProfileCharts` (playlists são heterogêneas)
4. Botão `←` lê `location.state?.from`

---

## Ponto de entrada: mudança no ArtistDetail (discografia)

```tsx
// Antes
onClick={() => playContext(album.uri)}

// Depois
onClick={() => navigate(`/albums/${album.id}`, { state: { from: location.pathname } })}
```

---

## Lib de gráficos

`recharts` já instalado e em uso no `TrackInfoPanel`. Nenhuma nova dependência necessária.

---

## TrackInfoPanel: bio da música via Wikipedia

Nova seção opcional no `TrackInfoPanel` (detalhes da música no player).

### Hook: `useTrackWikipedia(trackName, artistName)`

1. `OpenSearch` — `GET https://en.wikipedia.org/w/api.php?action=opensearch&search={trackName}+{artistName}+song&limit=3`
2. Pega o primeiro resultado cujo título contenha o nome da faixa
3. Fetch `GET https://en.wikipedia.org/api/rest_v1/page/summary/{title}`
4. Retorna `{ extract, url }` ou `null` se não encontrar

### Renderização

- Seção "Sobre a música" abaixo dos gráficos de audio features
- Exibe `extract` truncado em ~400 caracteres com link "Ler mais" para o artigo completo
- Seção completamente oculta se `useTrackWikipedia` retornar `null`
- Cobertura esperada: ~10–20% das faixas (hits populares e clássicos)

---

## Issues relacionados

- `spotify-player-wnd` — Busca: trocar filtros deve usar replace em vez de push no histórico (P3, separado)
