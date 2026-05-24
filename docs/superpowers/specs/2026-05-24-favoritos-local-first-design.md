# Favoritos — Local-first + Arc Label + Nota Pessoal

**Data:** 2026-05-24
**Status:** Aprovado para implementação

---

## Contexto

A tela de Favoritos (`Favorites.tsx`) e o hook `useSpoterPlaylist` atualmente dependem da API do Spotify para leitura da lista a cada navegação. O objetivo é inverter essa prioridade: localStorage como fonte de verdade entre telas, cookie como bootstrap de sessão, API do Spotify apenas para hidratação inicial de dados faltantes. Além disso, adicionar indicador visual de favorito no disco de vinil, nota pessoal por faixa, e reformular o popover "Adicionar" como um formulário estruturado com autocomplete.

---

## 1. Estratégia de Persistência

### Fontes de dados e responsabilidades

| Fonte | Chave | Conteúdo | Quando lida | Quando escrita |
|---|---|---|---|---|
| **Cookie** | `spoter_fav_v1_${userId}` | `[{ uri: string, note: string }]` | Apenas no boot | Em toda mutação (add / remove / update note) |
| **localStorage** | `spoter_favorites_${userId}` | `SpotifyTrack[]` | Entre todas as telas | Em toda mutação |
| **localStorage** | `spoter_fav_notes_${userId}` | `{ [uri: string]: string }` | Entre todas as telas | Ao salvar/editar nota |
| **Spotify API** | `GET /tracks?ids=` | Dados completos de tracks | Uma única vez no boot | Nunca (somente playlist sync em background) |

### Fluxo de boot

```
1. Lê cookie  → extrai lista [{uri, note}]
2. Lê localStorage (tracks + notes)
3. URIs no cookie sem dados em localStorage → 1x fetch /tracks?ids=...
4. Merge resultado no localStorage
5. Renderiza a partir do localStorage — nunca mais lê da API
```

### Regras de mutação

- **add:** atualiza localStorage (tracks) + localStorage (notes se vier com nota) + cookie + sync Spotify playlist (background, fire-and-forget)
- **remove:** remove de localStorage (tracks + notes) + cookie + sync Spotify playlist (background)
- **update note:** atualiza localStorage (notes) + cookie; não toca a API

### Limitações do cookie

Cookie HTTP tem limite de ~4 KB. O array `[{uri, note}]` pode exceder isso com muitos favoritos e notas longas. Estratégia:

- Notas são truncadas no cookie em 80 caracteres (só para bootstrap); localStorage guarda o texto completo.
- Se a serialização exceder 3,5 KB, o cookie armazena apenas os URIs (sem nota) — as notas são carregadas do localStorage.
- Expiração do cookie: 1 ano (`max-age=31536000; path=/; SameSite=Strict`).

---

## 2. Hook `useSpoterPlaylist` — Mudanças

### Estado atual

O hook usa `usePlaylistTracks` (React Query) como fonte de verdade para a lista exibida, com localStorage apenas como cache otimista.

### Estado alvo

```
tracks = localTracks (sempre)
localTracks = localStorage → hidratado na inicialização pelo cookie + API one-shot
isLoading = true apenas durante a hidratação inicial (primeira vez sem dados locais)
```

### Hidratação inicial

```ts
// pseudo-código
const cookieEntries = readCookie(userId)           // [{uri, note}]
const localTracks = readLocalTracks(userId)        // SpotifyTrack[]
const localNotes = readLocalNotes(userId)          // {[uri]: string}

const missingUris = cookieEntries
  .map(e => e.uri)
  .filter(uri => !localTracks.some(t => t.uri === uri))

if (missingUris.length > 0) {
  const ids = missingUris.map(uri => uri.replace('spotify:track:', ''))
  const fetched = await api.get(`/tracks?ids=${ids.join(',')}`)
  writeLocalTracks(userId, [...localTracks, ...fetched.tracks])
}
```

### API de retorno do hook (sem mudanças na interface pública)

```ts
{
  tracks: SpotifyTrack[]          // fonte: localStorage
  notes: Record<string, string>   // novo campo
  addTrack: (track, note?) => void
  removeTrack: (uri) => void
  updateNote: (uri, note) => void // novo
  isLoading: boolean
  playlistId: string
  playlistName: string
}
```

---

## 3. Formulário "Adicionar Favorito" (Popover)

### Estrutura

O popover atual (busca → lista → clique para adicionar) é substituído por um formulário estruturado com dois campos e um botão de ação no rodapé.

```
┌─────────────────────────────────┐
│  Adicionar Favorito             │
│                                 │
│  Música *                       │
│  [autocomplete input          ] │
│  [resultado 1                 ] │
│  [resultado 2                 ] │
│  [resultado 3                 ] │
│                                 │
│  Nota pessoal                   │
│  [textarea livre              ] │
│                                 │
│  [    Adicionar ao favorito   ] │
└─────────────────────────────────┘
```

### react-hook-form + Zod

**Schema Zod:**

```ts
const addFavoriteSchema = z.object({
  track: z.object({
    id: z.string(),
    uri: z.string(),
    name: z.string(),
    artists: z.array(z.object({ name: z.string() })),
    album: z.object({
      name: z.string(),
      images: z.array(z.object({ url: z.string() })),
    }),
    duration_ms: z.number(),
  }, { required_error: t('favorites.trackRequired') }),
  note: z.string().max(300, t('favorites.noteTooLong')).optional(),
})
```

**Registro dos campos:**

- `track`: campo controlado via `Controller` + `setValue`/`watch` — o autocomplete é um componente customizado que chama `setValue('track', selectedTrack)` e `trigger('track')` ao selecionar.
- `note`: `register('note')` direto num `<textarea>`.

**Vantagem de usar `Controller` para o autocomplete:** permite exibir o estado de validação (`fieldState.error`) diretamente do rhf sem estado local extra, e o `formState.isValid` habilita/desabilita o botão de submit de forma reativa sem `watch` manual.

**Submit:** `handleSubmit(onAdd)` — chama `addTrack(data.track, data.note)` e fecha o popover. `reset()` após sucesso.

### Campo Autocomplete

- Input controlado pelo rhf via `Controller`
- Ao digitar ≥2 caracteres: dispara `useSearchTracks(query)` (já existe)
- Resultados exibidos como dropdown absolute abaixo do input
- Ao selecionar uma sugestão: preenche o campo com o nome da track + fecha o dropdown + `setValue('track', track)` + `trigger('track')`
- Ao limpar o input: `setValue('track', undefined)` para reativar validação
- Navegação por teclado: `ArrowUp/Down` nas sugestões, `Enter` para selecionar, `Escape` para fechar
- `aria-autocomplete="list"`, `aria-controls` e `role="listbox"` nos resultados

### Validação e estados

| Estado | Comportamento |
|---|---|
| Campo track vazio + submit | Mensagem de erro inline abaixo do input |
| Track selecionada | Chip com nome + ícone X para limpar |
| Track já é favorita | Botão desabilitado + mensagem inline `t('favorites.alreadyFavorite')` |
| Nota > 300 chars | Contador de caracteres vira vermelho, botão desabilitado |
| Loading (adicionando) | Botão com spinner, campos readonly |

### Strings i18n necessárias

```jsonc
// pt-BR.json — favoritos
"trackRequired": "Selecione uma música",
"noteTooLong": "Máximo de 300 caracteres",
"alreadyFavorite": "Já está nos favoritos",
"notePlaceholder": "Uma nota pessoal (opcional)...",
"noteLabel": "Nota pessoal",
"trackLabel": "Música",
"addConfirm": "Adicionar ao favorito",
"searchAutocomplete": "Buscar música ou artista...",
"isFavorite": "♥ FAVORITO"
```

---

## 4. Nota Pessoal na Lista

Cada linha de favorito em `Favorites.tsx` exibe a nota (se houver) abaixo do nome. Edição inline:

- Ícone de lápis visível ao hover na linha
- Clique no lápis abre `<input>` inline no lugar da nota
- `onBlur` → `updateNote(uri, value)` → fecha o input
- Sem formulário separado — interação direta, zero friction
- String vazia = remover nota

---

## 5. Arc Label no VinylDisk

### Quando exibir

`PersistentVinylDisk` verifica se `state.currentTrack?.uri` está na lista de favoritos (localStorage, leitura síncrona). Se sim: renderiza o arc label.

### Implementação SVG

O `VinylDisk` recebe prop opcional `favoriteLabel?: string`. Quando presente, renderiza um SVG estático (não gira) absolutamente posicionado sobre o disco:

```svg
<svg width={px} height={px} style="position:absolute;inset:0;pointer-events:none">
  <defs>
    <path id="arc-fav-{uid}" d="M {x1} {y1} A {r} {r} 0 0 1 {x2} {y2}" />
  </defs>
  <!-- stroke branco grosso = fundo legível -->
  <text
    paint-order="stroke fill"
    stroke="white"
    stroke-width="10"
    stroke-linejoin="round"
    fill="rgba(0,0,0,0.6)"
    font-size="11"
    font-weight="700"
    letter-spacing="2"
    font-family="monospace"
  >
    <textPath href="#arc-fav-{uid}" startOffset="50%" textAnchor="middle">
      {favoriteLabel.toUpperCase()}
    </textPath>
  </text>
</svg>
```

**Geometria:** o arco segue o topo do disco, raio ~88% de `px/2`, abrangendo ~120° centrado no topo (de ~240° a ~300° no sistema de ângulos SVG).

**Animação:** `AnimatePresence` + `motion.svg` com `opacity: 0 → 1` ao montar, `opacity: 1 → 0` ao desmontar (`transition: { duration: 0.4 }`).

### Fundo branco no ArcCarousel

Mesma técnica aplicada ao `<text>` existente em `ArcCarousel.tsx` — adicionar `paintOrder="stroke fill"`, `stroke="white"`, `strokeWidth="8"`, `strokeLinejoin="round"`. Nenhuma mudança na geometria.

---

## 6. Arquivos a criar / modificar

| Arquivo | Operação | Motivo |
|---|---|---|
| `src/hooks/useSpoterPlaylist.ts` | Modificar | Local-first, cookie, one-shot API, `updateNote` |
| `src/utils/favCookie.ts` | Criar | Leitura/escrita do cookie de favoritos |
| `src/pages/Favorites.tsx` | Modificar | Nota inline, novo popover |
| `src/components/favorites/AddFavoriteForm.tsx` | Criar | Formulário rhf+zod com autocomplete |
| `src/components/favorites/TrackAutocomplete.tsx` | Criar | Input autocomplete isolado (Controller-ready) |
| `src/components/vinyl/VinylDisk.tsx` | Modificar | Prop `favoriteLabel`, SVG arc overlay |
| `src/components/vinyl/PersistentVinylDisk.tsx` | Modificar | Detectar favorito, passar `favoriteLabel` |
| `src/components/vinyl/ArcCarousel.tsx` | Modificar | `paint-order` no texto do arc |
| `src/locales/pt-BR.json` | Modificar | Novas strings i18n |
| `src/locales/en-US.json` | Modificar | Novas strings i18n |

---

## 7. Não está no escopo

- Sincronização em tempo real entre abas (sem BroadcastChannel)
- Paginação da lista de favoritos
- Reordenação drag-and-drop
- Busca dentro dos favoritos existentes (filtro local)
