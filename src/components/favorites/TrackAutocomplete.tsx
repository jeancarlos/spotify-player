import { useState, useRef, useId, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useSearchTracks } from '@/hooks/queries/useSearchTracks'
import { useDebounce } from '@/hooks/useDebounce'
import { useKeyboardNav } from '@/hooks/useKeyboardNav'
import { cn } from '@/lib/utils'
import type { SpotifyTrack } from '@/types/spotify'

interface ResultsListProps {
  listboxId: string
  results: SpotifyTrack[]
  highlightIndex: number
  onSelect: (track: SpotifyTrack) => void
  label: string
}

function ResultsList({ listboxId, results, highlightIndex, onSelect, label }: ResultsListProps) {
  return (
    <ul
      id={listboxId}
      role="listbox"
      aria-label={label}
      className="absolute top-full rounded-xl rounded-t-none h-[160px] mt-1 left-0 right-0 bg-white overflow-y-auto max-h-60 z-50 shadow-xl"
    >
      {results.map((track, i) => (
        <li
          key={track.id}
          id={`${listboxId}-${i}`}
          role="option"
          aria-selected={i === highlightIndex}
          onClick={() => {
            onSelect(track)
          }}
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
  )
}

interface SelectedTrackProps {
  track: SpotifyTrack
  onClear: () => void
  clearLabel: string
}

function SelectedTrack({ track, onClear, clearLabel }: SelectedTrackProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-black/5 rounded-xl">
      <img
        src={track.album.images[0]?.url}
        className="w-6 h-6 rounded object-cover shrink-0"
        alt=""
      />
      <span className="text-sm text-black flex-1 truncate">{track.name}</span>
      <span className="text-[11px] text-black/40 truncate hidden sm:block">
        {track.artists.map((a) => a.name).join(', ')}
      </span>
      <button
        type="button"
        onClick={onClear}
        aria-label={clearLabel}
        className="p-0.5 text-black/30 hover:text-black/70 transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  )
}

interface TrackSearchInputProps {
  inputRef: React.RefObject<HTMLInputElement | null>
  blurTimerRef: React.RefObject<number>
  query: string
  isOpen: boolean
  results: SpotifyTrack[]
  highlightIndex: number
  listboxId: string
  isPending: boolean
  debouncedQuery: string
  error?: string
  onQueryChange: (query: string) => void
  onOpen: () => void
  onClose: () => void
  onBlur: () => void
  onSelect: (track: SpotifyTrack) => void
  setHighlightIndex: React.Dispatch<React.SetStateAction<number>>
  placeholder: string
  loadingText: string
  resultsLabel: string
}

function TrackSearchInput({
  inputRef,
  blurTimerRef,
  query,
  isOpen,
  results,
  highlightIndex,
  listboxId,
  isPending,
  debouncedQuery,
  error,
  onQueryChange,
  onOpen,
  onClose,
  onBlur,
  onSelect,
  setHighlightIndex,
  placeholder,
  loadingText,
  resultsLabel,
}: TrackSearchInputProps) {
  const handleKeyDown = useKeyboardNav({
    isOpen,
    results,
    highlightIndex,
    setHighlightIndex,
    onSelect,
    onClose,
  })

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
        placeholder={placeholder}
        className={cn(
          'w-full px-3 py-2 bg-black/5 rounded-xl text-sm text-black',
          'placeholder:text-black/30 outline-none focus:bg-black/[0.08] transition-colors',
          isOpen ? 'rounded-b-none' : 'rounded-xl',
          error && 'ring-1 ring-red-400'
        )}
        onChange={(e) => {
          onQueryChange(e.target.value)
          onOpen()
          setHighlightIndex(() => -1)
        }}
        onBlur={() => {
          onBlur()
          blurTimerRef.current = window.setTimeout(() => {
            onClose()
          }, 150)
        }}
        onKeyDown={handleKeyDown}
      />

      {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}

      {isPending && debouncedQuery.length >= 2 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl p-3 z-50 shadow-xl">
          <p className="text-xs text-black/40 text-center">{loadingText}</p>
        </div>
      )}

      {isOpen && results.length > 0 && (
        <ResultsList
          listboxId={listboxId}
          results={results}
          highlightIndex={highlightIndex}
          onSelect={onSelect}
          label={resultsLabel}
        />
      )}
    </div>
  )
}

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
  const blurTimerRef = useRef<number>(0)

  useEffect(
    () => () => {
      clearTimeout(blurTimerRef.current)
    },
    []
  )

  const debouncedQuery = useDebounce(query, 300)
  const { data: results = [], isPending } = useSearchTracks(
    debouncedQuery,
    debouncedQuery.length >= 2
  )

  const handleSelect = (track: SpotifyTrack) => {
    clearTimeout(blurTimerRef.current)
    onChange(track)
    setQuery('')
    setIsOpen(false)
    setHighlightIndex(-1)
  }

  const handleClear = () => {
    onChange(null)
    setQuery('')
    setHighlightIndex(-1)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  if (value) {
    return (
      <SelectedTrack track={value} onClear={handleClear} clearLabel={t('favorites.clearTrack')} />
    )
  }

  return (
    <TrackSearchInput
      inputRef={inputRef}
      blurTimerRef={blurTimerRef}
      query={query}
      isOpen={isOpen}
      results={results}
      highlightIndex={highlightIndex}
      listboxId={listboxId}
      isPending={isPending}
      debouncedQuery={debouncedQuery}
      error={error}
      onQueryChange={setQuery}
      onOpen={() => {
        setIsOpen(true)
      }}
      onClose={() => {
        setIsOpen(false)
      }}
      onBlur={onBlur}
      onSelect={handleSelect}
      setHighlightIndex={setHighlightIndex}
      placeholder={t('favorites.searchAutocomplete')}
      loadingText={t('common.loading')}
      resultsLabel={t('favorites.trackLabel')}
    />
  )
}
