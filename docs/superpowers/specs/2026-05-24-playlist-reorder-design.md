# Design: Reordenação de Favoritos

**Data:** 2026-05-24  
**Escopo:** Página `/favorites` (Spoter playlist — sempre do usuário)

---

## Resumo

Adicionar reordenação de tracks na tela de Favoritos via dois mecanismos: arrastar (drag-and-drop) e edição direta do número de posição. Sincronizar a nova ordem com a playlist no Spotify via API. Incluir botão de refresh para puxar o estado atual do Spotify. Corrigir inconsistências visuais da tela.

---

## Escopo

- **Inclui:** `/favorites` exclusivamente
- **Exclui:** `PlaylistDetail`, `AlbumDetail`, `ArtistDetail` e qualquer outra tela — nenhum elemento de drag é carregado nelas
- **Biblioteca de drag:** `framer-motion Reorder` (já instalada, zero dependência nova)

---

## Arquitetura

### Arquivos novos

| Arquivo | Descrição |
|---|---|
| `src/hooks/mutations/useReorderPlaylistTracks.ts` | Mutation para `PUT /playlists/{id}/tracks` |

### Arquivos modificados

| Arquivo | O que muda |
|---|---|
| `src/hooks/useSpoterPlaylist.ts` | Adiciona `reorderTrack`, `refresh`, `isRefreshing` |
| `src/components/shared/TrackRow.tsx` | Prop opcional `onReorderTo` — número de índice editável |
| `src/components/favorites/TrackAutocomplete.tsx` | Fix visual: `ResultsList` usa glassmorphism |
| `src/components/shared/Tooltip.tsx` | Adiciona props `placement`, `align`, `maxWidth` |
| `src/pages/Favorites.tsx` | `Reorder.Group`, drag handles, botão refresh, Inter font no título |
| `src/locales/pt-BR.json` + `en-US.json` | Strings novas |

---

## Camada de dados

### `useReorderPlaylistTracks`

```
PUT /playlists/{playlistId}/tracks
Body: { range_start: fromIndex, insert_before: insertBefore }
```

- `insertBefore = toIndex > fromIndex ? toIndex + 1 : toIndex`
- `snapshot_id` omitido (opcional na API — sem conflict detection)
- Sem `onSuccess` invalidation: a atualização otimista local já reflete o estado correto

### `useSpoterPlaylist` — adições

**`reorderTrack(fromIndex: number, toIndex: number)`**
1. Clamp: `toIndex = Math.max(0, Math.min(toIndex, localTracks.length - 1))`
2. Retorna sem ação se `fromIndex === toIndex`
3. Calcula `newTracks`: splice do array local
4. `writeLocalTracks(userId, newTracks)`
5. `setLocalTracks(newTracks)`
6. `reorderMutation.mutate({ playlistId, rangeStart: fromIndex, insertBefore })`

**`refresh()`**
1. Seta `isRefreshing = true`
2. Refetch da query `['playlist-tracks', playlistId, 1, 50]`
3. Ao completar: sobrescreve `localTracks` + `localStorage` com dados do Spotify
4. Seta `isRefreshing = false`

**Retorno do hook:** adiciona `reorderTrack`, `refresh`, `isRefreshing`

---

## UI de reordenação

### Estrutura de drag em `Favorites.tsx`

```
// Estado local para animação fluida
const [sortedTracks, setSortedTracks] = useState(tracks)
const sortedTracksRef = useRef(sortedTracks)   // evita closure stale no onDragEnd
const originalOrderRef = useRef(tracks)

// Mantém refs sincronizados
useEffect(() => {
  setSortedTracks(tracks)
  sortedTracksRef.current = tracks
}, [tracks])

function handleReorder(newOrder: SpotifyTrack[]) {
  setSortedTracks(newOrder)
  sortedTracksRef.current = newOrder
}

<Reorder.Group values={sortedTracks} onReorder={handleReorder} axis="y">
  {sortedTracks.map((track, i) => (
    <Reorder.Item
      key={track.id}
      value={track}
      onDragStart={() => { originalOrderRef.current = sortedTracksRef.current }}
      onDragEnd={() => {
        const from = originalOrderRef.current.findIndex(t => t.id === track.id)
        const to = sortedTracksRef.current.findIndex(t => t.id === track.id)
        if (from !== to) reorderTrack(from, to)
      }}
    >
      <GripVertical className="text-black/20 hover:text-black/50 shrink-0" size={16} />
      <TrackRow
        track={track}
        index={i}
        onReorderTo={(newIdx) => reorderTrack(i, newIdx)}
        ...
      />
    </Reorder.Item>
  ))}
</Reorder.Group>
```

**Isolamento:** `GripVertical` e `Reorder.*` ficam exclusivamente em `Favorites.tsx`. Nenhuma outra tela carrega esses elementos.

### Número editável em `TrackRow`

Prop nova: `onReorderTo?: (newIndex: number) => void`

Comportamento quando presente:
- O número de posição (index) vira `<button>` clicável
- Clique → substitui por `<input type="number">` com valor atual (1-based)
- Confirmar: `Enter` ou `onBlur` → chama `onReorderTo(valor - 1)` se valor for número válido
- Cancelar: `Escape` → restaura display do número sem ação
- **Validação de range:** responsabilidade do `reorderTrack` no hook (clamp para `[0, tracks.length - 1]`), não do `TrackRow`. Assim o componente permanece genérico.

Quando ausente (todas as outras telas): renderização idêntica à atual, sem impacto.

---

## Botão refresh

Posicionado ao lado do botão `+` no header de `Favorites.tsx`:

```tsx
<Tooltip content={t('favorites.refreshFromSpotify')}>
  <button
    onClick={refresh}
    disabled={isRefreshing}
    className="p-2 glass rounded-full text-black/50 hover:text-black/80 transition-colors disabled:opacity-40"
    aria-label={t('favorites.refreshFromSpotify')}
  >
    <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
  </button>
</Tooltip>
```

---

## Ajustes visuais

### Título da tela (`Favorites.tsx`)
```tsx
// Antes
<h1 className="text-2xl font-black text-black">{t('nav.favorites')}</h1>

// Depois
<h1
  className="text-2xl font-black text-black"
  style={{ fontFamily: 'Inter, sans-serif' }}
>
  {t('nav.favorites')}
</h1>
```
Alinha com `CollectionHeader`, `ArtistHeader` e `TrackInfoPanel`.

### `ResultsList` em `TrackAutocomplete.tsx`
```tsx
// Antes
className="absolute top-full rounded-xl ... bg-white ..."

// Depois
className="absolute top-full rounded-xl ... bg-white/90 backdrop-blur-sm ..."
```
Remove o `bg-white` hard que quebrava o glassmorphism do app.

### Unificação do componente `Tooltip`

Atualmente existem dois designs de tooltip divergentes:

| Onde | Implementação | Problema |
|---|---|---|
| `Tooltip.tsx` (compartilhado) | Componente próprio | `whitespace-nowrap`, centralizado, posição `-top-7` |
| Nota pessoal em `TrackRow` | Inline manual | `whitespace-normal`, alinhado à esquerda, `bottom-full` |

**Fix:** Estender `Tooltip.tsx` com props opcionais e usar o componente em ambos os casos:

```tsx
interface TooltipProps {
  content: string
  children: ReactNode
  placement?: 'top' | 'bottom'   // default: 'top'
  align?: 'center' | 'start'     // default: 'center'
  maxWidth?: string               // default: 'whitespace-nowrap'
}
```

`TrackRow` substitui o tooltip inline pelo `<Tooltip placement="bottom" align="start" maxWidth="max-w-xs">` — mesmo visual, zero código duplicado.

---

## Strings novas (i18n)

| Chave | pt-BR | en-US |
|---|---|---|
| `favorites.refreshFromSpotify` | `Atualizar do Spotify` | `Refresh from Spotify` |

---

## Tratamento de erros

- Falha no `reorderTrack` (API Spotify): reverter `localTracks` para `originalOrderRef.current`, exibir toast de erro
- Falha no `refresh`: exibir toast de erro, manter estado local atual
- Input de número inválido (fora do range): ignorar silenciosamente, restaurar número original

---

## Testes

- Unit: `reorderTrack` — lógica de splice e cálculo de `insertBefore`
- Unit: prop `onReorderTo` em `TrackRow` — validação de range, eventos de teclado
- Sem E2E para drag (framer-motion não é testável via Playwright facilmente)
