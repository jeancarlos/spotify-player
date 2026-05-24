import { useState, useRef, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useSearchTracks } from '@/hooks/queries/useSearchTracks'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'
import type { SpotifyTrack } from '@/types/spotify'

export interface TrackAutocompleteProps {
  value: SpotifyTrack | null
  onChange: (track: SpotifyTrack | null) => void
  onBlur: () => void
  error?: string
}

export function TrackAutocomplete({ value, onChange, onBlur, error }: TrackAutocompleteProps) {
  const { t } = useTranslation()
  const uid = useId()
  const listboxId = `${uid}-listbox`

  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(query, 300)
  // isPending é o nome correto no react-query v5 para queries não resolvidas
  const { data: results = [], isPending } = useSearchTracks(debouncedQuery, debouncedQuery.length >= 2)

  const handleSelect = (track: SpotifyTrack) => {
    onChange(track)
    setQuery('')
    setIsOpen(false)
    setHighlightIndex(-1)
  }

  const handleClear = () => {
    onChange(null)
    setQuery('')
    setHighlightIndex(-1)
    // Devolve foco ao input após limpar a seleção
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault()
      handleSelect(results[highlightIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setHighlightIndex(-1)
    }
  }

  // Exibe a faixa selecionada com opção de limpar
  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-black/5 rounded-xl">
        <img
          src={value.album.images[0]?.url}
          className="w-6 h-6 rounded object-cover shrink-0"
          alt=""
        />
        <span className="text-sm text-black flex-1 truncate">{value.name}</span>
        <span className="text-[11px] text-black/40 truncate hidden sm:block">
          {value.artists.map((a) => a.name).join(', ')}
        </span>
        <button
          type="button"
          onClick={handleClear}
          aria-label={t('favorites.clearTrack')}
          className="p-0.5 text-black/30 hover:text-black/70 transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        autoFocus
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen && results.length > 0}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-activedescendant={highlightIndex >= 0 ? `${listboxId}-${highlightIndex}` : undefined}
        placeholder={t('favorites.searchAutocomplete')}
        className={cn(
          'w-full px-3 py-2 bg-black/5 rounded-xl text-sm text-black',
          'placeholder:text-black/30 outline-none focus:bg-black/[0.08] transition-colors',
          error && 'ring-1 ring-red-400'
        )}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
          setHighlightIndex(-1)
        }}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
      />

      {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}

      {/* Indicador de carregamento enquanto aguarda resposta da API */}
      {isPending && debouncedQuery.length >= 2 && (
        <div className="absolute top-full mt-1 left-0 right-0 glass rounded-xl p-3 z-50 shadow-xl">
          <p className="text-xs text-black/40 text-center">{t('common.loading')}</p>
        </div>
      )}

      {/* Lista de sugestões com navegação por teclado */}
      {isOpen && results.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t('favorites.trackLabel')}
          className="absolute top-full mt-1 left-0 right-0 glass rounded-xl overflow-hidden z-50 shadow-xl"
        >
          {results.map((track, i) => (
            <li
              key={track.id}
              id={`${listboxId}-${i}`}
              role="option"
              aria-selected={i === highlightIndex}
              onClick={() => handleSelect(track)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors',
                i === highlightIndex ? 'bg-black/10' : 'hover:bg-black/5'
              )}
            >
              <img
                src={track.album.images[0]?.url}
                className="w-8 h-8 rounded-lg object-cover shrink-0"
                alt=""
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-black truncate">{track.name}</p>
                <p className="text-[11px] text-black/50 truncate">
                  {track.artists.map((a) => a.name).join(', ')}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
