# Favoritos — Local-first + Arc Label + Nota Pessoal

**Data:** 2026-05-24
**Status:** Aprovado para implementação

---

## Contexto

A tela de Favoritos (`Favorites.tsx`) e o hook `useSpoterPlaylist` atualmente dependem da API do Spotify para leitura da lista a cada navegação. O objetivo é inverter essa prioridade: localStorage como fonte de verdade entre telas, cookie como bootstrap de sessão, API do Spotify apenas para hidratação inicial de dados faltantes. Além disso: indicador visual de favorito no disco de vinil com arc label, nota pessoal por faixa, formulário de adição com autocomplete e validação, e melhoria geral de qualidade do código para facilitar manutenção.

---

## 1. Estratégia de Persistência

### Fontes de dados e responsabilidades

| Fonte | Chave | Conteúdo | Quando lida | Quando escrita |
|---|---|---|---|---|
| **Cookie** | `spoter_fav_v1_${userId}` | `[{ uri, note }]` — nota truncada em 80 chars | Apenas no boot | Em toda mutação |
| **localStorage** | `spoter_favorites_${userId}` | `SpotifyTrack[]` completo | Entre todas as telas | Em toda mutação |
| **localStorage** | `spoter_fav_notes_${userId}` | `{ [uri]: string }` — nota completa | Entre todas as telas | Ao salvar/editar nota |
| **Spotify API** | `GET /tracks?ids=` | Dados completos de tracks ausentes | Uma única vez no boot | Nunca (só playlist sync em background) |

### Regra fundamental: o track completo vai pro storage na hora do add

Ao adicionar um favorito via formulário, o objeto `SpotifyTrack` completo (nome, artistas, álbum, imagens, duração, URI) é gravado imediatamente no localStorage. Nenhuma chamada de API é necessária para re-hidratar esse track depois.

A API one-shot de boot serve exclusivamente para o caso de o usuário ter favoritos salvos no cookie mas ter limpado o localStorage (ex: troca de dispositivo, limpeza de cache do browser).

### Fluxo de boot

```
1. Lê cookie  → extrai [{uri, note}]
2. Lê localStorage (tracks + notes)
3. URIs presentes no cookie mas ausentes no localStorage → 1x GET /tracks?ids=...
4. Merge das tracks obtidas no localStorage
5. A partir daqui: renderiza exclusivamente a partir do localStorage
```

### Fluxo de mutação

```
add(track, note):
  localStorage.tracks.push(track)        // objeto completo
  localStorage.notes[track.uri] = note   // nota completa
  cookie = buildCookie(tracks, notes)    // [{uri, note truncada 80}]
  spotify.addToPlaylist(track.uri)       // fire-and-forget

remove(uri):
  localStorage.tracks = tracks.filter(...)
  delete localStorage.notes[uri]
  cookie = buildCookie(tracks, notes)
  spotify.removeFromPlaylist(uri)        // fire-and-forget

updateNote(uri, note):
  localStorage.notes[uri] = note
  cookie = buildCookie(tracks, notes)
  // não toca a API Spotify
```

### Cookie — limites práticos

- Tamanho máximo: ~4 KB por cookie HTTP.
- A nota é truncada em **80 caracteres** ao serializar para o cookie. O texto completo vive no localStorage.
- Se a serialização total exceder 3,5 KB, as notas são omitidas do cookie (apenas URIs preservados). O localStorage guarda tudo.
- Expiração: `max-age=31536000` (1 ano), `path=/`, `SameSite=Strict`.

---

## 2. Módulo `favCookie.ts` — Abstração de cookie

```ts
// src/utils/favCookie.ts

interface CookieEntry { uri: string; note: string }

const COOKIE_KEY = (userId: string) => `spoter_fav_v1_${userId}`
const NOTE_TRUNCATE = 80
const COOKIE_BYTE_LIMIT = 3500

export function readFavCookie(userId: string): CookieEntry[]
export function writeFavCookie(userId: string, entries: CookieEntry[]): void
// buildCookie: trunca notas, verifica tamanho, omite notas se exceder limite
```

Toda leitura/escrita de cookie é feita exclusivamente por este módulo. Componentes e hooks não manipulam `document.cookie` diretamente.

---

## 3. Hook `useSpoterPlaylist` — Refatoração

### Interface pública (sem breaking changes para os consumidores atuais)

```ts
export function useSpoterPlaylist(): {
  tracks: SpotifyTrack[]
  notes: Record<string, string>     // novo
  addTrack: (track: SpotifyTrack, note?: string) => void
  removeTrack: (uri: string) => void
  updateNote: (uri: string, note: string) => void  // novo
  isLoading: boolean
  playlistId: string
  playlistName: string
}
```

### Princípio de abstração

O hook expõe apenas **dados e ações**. Toda lógica de leitura/escrita (cookie, localStorage, merge, hidratação) vive em funções puras utilitárias:

```
src/utils/favStorage.ts   → readLocalTracks / writeLocalTracks
                            readLocalNotes  / writeLocalNotes
src/utils/favCookie.ts    → readFavCookie  / writeFavCookie
src/utils/favHydration.ts → hydrateFromApi(userId, uris) → Promise<SpotifyTrack[]>
```

O hook orquestra essas funções, sem lógica de serialização inline.

### Estado de loading

`isLoading` é `true` apenas durante a hidratação initial (fetch da API one-shot). Uma vez concluída (ou se não for necessária), nunca mais volta a `true` por causa de leitura da lista.

---

## 4. Formulário "Adicionar Favorito" — react-hook-form + Zod

### Schema Zod

```ts
import type { SpotifyTrack } from '@/types/spotify'

const addFavoriteSchema = z.object({
  track: z
    .custom<SpotifyTrack>(
      (val) => val !== null && typeof val === 'object' && 'uri' in val,
      { message: t('favorites.trackRequired') }
    ),
  note: z
    .string()
    .max(300, t('favorites.noteTooLong'))
    .optional()
    .default(''),
})

type AddFavoriteForm = z.infer<typeof addFavoriteSchema>
```

**Por que `z.custom<SpotifyTrack>`:** o campo `track` é preenchido pelo autocomplete (não é um `<input>` nativo), então não há conversão de string. `z.custom` permite validar o objeto diretamente mantendo o tipo inferido correto.

### Campos

**Campo `track` — via `Controller`:**

```tsx
<Controller
  name="track"
  control={control}
  render={({ field, fieldState }) => (
    <TrackAutocomplete
      value={field.value ?? null}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
    />
  )}
/>
```

`TrackAutocomplete` é um componente isolado (`src/components/favorites/TrackAutocomplete.tsx`) — recebe `value/onChange/onBlur/error` como props, sem conhecimento do rhf. Isso o torna testável e reutilizável.

**Campo `note` — via `register`:**

```tsx
<textarea
  {...register('note')}
  placeholder={t('favorites.notePlaceholder')}
  maxLength={320}  // ~10% acima do limite Zod para UI feedback gradual
  rows={2}
/>
<span>{watchedNote?.length ?? 0}/300</span>
```

**Botão de submit:**

```tsx
<button
  type="submit"
  disabled={!formState.isValid || formState.isSubmitting || isAlreadyFavorite}
>
  {formState.isSubmitting ? <Spinner /> : t('favorites.addConfirm')}
</button>
```

`formState.isValid` reativo via `mode: 'onChange'` no `useForm`. Sem `watch` manual para controlar o botão.

**Guard de duplicata:**

```tsx
const watchedTrack = watch('track')
const isAlreadyFavorite = !!watchedTrack && tracks.some(t => t.uri === watchedTrack.uri)
```

Exibe mensagem inline `t('favorites.alreadyFavorite')` abaixo do campo quando `isAlreadyFavorite === true`.

### Submit

```ts
const onSubmit = handleSubmit(({ track, note }) => {
  addTrack(track, note)     // grava no storage + cookie + sync Spotify
  reset()
  onClose()
})
```

`reset()` restaura os defaults do schema (track: undefined, note: '').

### Estrutura visual

```
┌─────────────────────────────────┐
│  Adicionar Favorito             │  ← heading, t('favorites.addHeading')
│                                 │
│  Música *                       │  ← label, t('favorites.trackLabel')
│  [autocomplete input          ] │
│  [sugestão 1 — capa + nome    ] │
│  [sugestão 2                  ] │
│  [erro inline se inválido     ] │
│                                 │
│  Nota pessoal                   │  ← label, t('favorites.noteLabel')
│  [textarea 2 linhas           ] │
│  [contador xx/300             ] │
│                                 │
│  [    Adicionar ao favorito   ] │  ← disabled até track selecionada
└─────────────────────────────────┘
```

---

## 5. Componente `TrackAutocomplete`

### Responsabilidades

- Input de texto controlado (valor exibido = nome da track selecionada, ou o que o usuário digita para busca)
- Ao digitar ≥2 chars: dispara `useSearchTracks(query)` (debounce 300ms)
- Resultados em dropdown absoluto abaixo do input
- Ao selecionar: `onChange(track)`, fecha dropdown, exibe chip com nome + botão X para limpar
- Ao limpar: `onChange(null)`, volta ao estado de busca
- Navegação por teclado: `ArrowUp/Down`, `Enter` para selecionar, `Escape` para fechar
- Acessibilidade: `role="combobox"`, `aria-expanded`, `aria-controls`, `role="listbox"` no dropdown

### Props

```ts
interface TrackAutocompleteProps {
  value: SpotifyTrack | null
  onChange: (track: SpotifyTrack | null) => void
  onBlur: () => void
  error?: string
}
```

Sem estado interno de "track selecionada" — é controlado pelo rhf via `value/onChange`.

---

## 6. Nota Pessoal na Lista (`Favorites.tsx`)

- Exibe a nota abaixo do nome da track (se houver), estilo `text-[11px] text-black/40 italic`
- Ícone de lápis visível ao hover na linha
- Clique → substitui a nota por `<input>` inline com valor atual
- `onBlur` → `updateNote(uri, value.trim())`. String vazia = remove a nota
- Nenhum formulário extra, nenhum estado global — `useState` local por linha

---

## 7. Arc Label no `VinylDisk`

### Geometria — cálculo de capacidade

```
Disco tamanho xl: px = 720
Raio do arco:     r = px / 2 × k        ← k é a fração a ajustar (ex: 0.88)
Ângulo do arco:   θ° (ex: 120°)
Comprimento:      L = 2π × r × (θ/360)

Com k=0.88, θ=120°, px=720:
  r = 316.8 px
  L = 2π × 316.8 × 0.333 ≈ 663 px

Fonte monospace, font-size=11, letter-spacing=1.5:
  largura média por char ≈ 8.5 px
  chars que cabem = floor(663 / 8.5) ≈ 78  →  limite de 80 chars

Para ajustar o arco, editar k e θ neste trecho:
```

```tsx
// ─── EDITAR AQUI: geometria do arco ───────────────────────────────────────
const k = 0.88          // fração do raio do disco (0.0 – 1.0)
const arcDeg = 120      // graus abrangidos pelo arco
// ──────────────────────────────────────────────────────────────────────────
```

### Implementação

`VinylDisk` recebe `favoriteLabel?: string`. Quando presente, renderiza um SVG **estático** (não gira) absolutamente posicionado sobre o disco:

```tsx
{favoriteLabel && (
  <ArcTextOverlay
    label={favoriteLabel}
    diskPx={px}
    k={0.88}
    arcDeg={120}
  />
)}
```

`ArcTextOverlay` é um componente isolado em `src/components/vinyl/ArcTextOverlay.tsx` — recebe `label, diskPx, k, arcDeg` e calcula o path SVG internamente. Reutilizável no futuro.

SVG arc text com fundo legível via `paint-order`:

```svg
<text
  paintOrder="stroke fill"
  stroke="white"
  strokeWidth="10"
  strokeLinejoin="round"
  fill="rgba(0,0,0,0.6)"
  fontSize="11"
  fontWeight="700"
  letterSpacing="2"
  fontFamily="monospace"
>
  <textPath href={`#arc-${uid}`} startOffset="50%" textAnchor="middle">
    {label.toUpperCase()}
  </textPath>
</text>
```

Animação: `AnimatePresence` + `motion.svg` com `opacity 0→1` ao montar.

### Fundo branco no `ArcCarousel` existente

Mesma técnica: adicionar `paintOrder="stroke fill"`, `stroke="white"`, `strokeWidth="8"`, `strokeLinejoin="round"` ao `<text>` existente. Nenhuma mudança de geometria.

---

## 8. Qualidade de código — diretrizes de implementação

### Separação de responsabilidades

| Camada | O que faz | O que não faz |
|---|---|---|
| Utilitários (`favStorage`, `favCookie`, `favHydration`) | Leitura/escrita, serialização, merge | Não sabe de React, não usa hooks |
| Hook (`useSpoterPlaylist`) | Orquestra utilitários, expõe estado reativo | Não serializa, não acessa `document.cookie` diretamente |
| Componentes | Renderiza, chama actions do hook | Não acessa localStorage, não lê cookie |

### Funções puras para lógica de storage

Cada utilitário exporta funções puras (input → output, sem efeitos colaterais fora do storage). Facilita testes unitários sem mock de React.

### `TrackAutocomplete` desacoplado do rhf

O componente recebe `value/onChange/onBlur/error` como props padrão, sem depender do `useFormContext`. Pode ser usado fora de um formulário rhf se necessário.

### Evitar `watch` desnecessário

Usar `formState.isValid` (reativo) em vez de `watch` + comparação manual para controlar o estado do botão. Usar `watch` apenas onde o valor precisa ser lido em tempo real para renderização (ex: contador de chars da nota, guard de duplicata).

### Comentários de edição explícitos

Em qualquer trecho com valores "mágicos" que o usuário ajustará manualmente (geometria do arco, limites de chars), adicionar bloco de comentário delimitado como mostrado na Seção 7.

---

## 9. Strings i18n — novas chaves

Adicionar em `pt-BR.json` e `en-US.json` dentro da seção `"favorites"`:

```jsonc
// novas chaves pt-BR
"trackRequired": "Selecione uma música",
"noteTooLong": "Máximo de 300 caracteres",
"alreadyFavorite": "Já está nos favoritos",
"notePlaceholder": "Uma nota pessoal (opcional)...",
"noteLabel": "Nota pessoal",
"trackLabel": "Música",
"addConfirm": "Adicionar ao favorito",
"searchAutocomplete": "Buscar música ou artista...",
"isFavorite": "♥ FAVORITO",
"noteCharsLeft": "{{count}}/300",
"editNote": "Editar nota",
"removeNote": "Remover nota"
```

Todas as strings nos componentes e hooks passam por `t()`. Nenhum texto hardcoded nos arquivos `.tsx`.

---

## 10. Arquivos a criar / modificar

| Arquivo | Operação | Motivo |
|---|---|---|
| `src/utils/favStorage.ts` | Criar | Leitura/escrita de tracks e notas no localStorage |
| `src/utils/favCookie.ts` | Criar | Leitura/escrita do cookie de favoritos |
| `src/utils/favHydration.ts` | Criar | Fetch one-shot da API para hidratar URIs sem dados locais |
| `src/hooks/useSpoterPlaylist.ts` | Modificar | Local-first, orquestrar utilitários, expor `updateNote` |
| `src/components/favorites/AddFavoriteForm.tsx` | Criar | Formulário rhf+zod com `TrackAutocomplete` |
| `src/components/favorites/TrackAutocomplete.tsx` | Criar | Autocomplete isolado, Controller-ready |
| `src/components/vinyl/ArcTextOverlay.tsx` | Criar | SVG arc text estático reutilizável |
| `src/components/vinyl/VinylDisk.tsx` | Modificar | Prop `favoriteLabel`, renderiza `ArcTextOverlay` |
| `src/components/vinyl/PersistentVinylDisk.tsx` | Modificar | Detectar favorito, passar `favoriteLabel` |
| `src/components/vinyl/ArcCarousel.tsx` | Modificar | `paint-order` no texto do arc |
| `src/pages/Favorites.tsx` | Modificar | Nota inline, usar `AddFavoriteForm` |
| `src/locales/pt-BR.json` | Modificar | Novas strings i18n |
| `src/locales/en-US.json` | Modificar | Novas strings i18n |

---

## 11. Fora do escopo

- Sincronização entre abas (sem BroadcastChannel)
- Paginação da lista de favoritos
- Reordenação drag-and-drop
- Filtro/busca dentro dos favoritos existentes
