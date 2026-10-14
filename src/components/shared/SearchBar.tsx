import { useState, useEffect, useRef } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'
import { saveLastSearch, type SearchTab } from '@/utils/search'

interface SearchBarProps {
  onSearch: (query: string, tab: SearchTab) => void
  defaultTab?: SearchTab
  defaultQuery?: string
  className?: string
}

export function SearchBar({
  onSearch,
  defaultTab = 'artist',
  defaultQuery = '',
  className,
}: SearchBarProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState(defaultQuery)
  const [tab, setTab] = useState<SearchTab>(defaultTab)
  const debouncedQuery = useDebounce(query, 700)
  const isPending = query !== debouncedQuery
  const lastSubmittedSearch = useRef(`${defaultQuery}\u0000${defaultTab}`)
  const onSearchRef = useRef(onSearch)

  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  useEffect(() => {
    const searchKey = `${debouncedQuery}\u0000${tab}`
    if (searchKey === lastSubmittedSearch.current) {
      return
    }

    lastSubmittedSearch.current = searchKey
    saveLastSearch(debouncedQuery, tab)
    onSearchRef.current(debouncedQuery, tab)
  }, [debouncedQuery, tab])

  const tabs: { key: SearchTab; label: string }[] = [
    { key: 'artist', label: t('artists.tabArtist') },
    { key: 'album', label: t('artists.tabAlbum') },
    { key: 'playlist', label: t('artists.tabPlaylist') },
  ]

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    const last = tabs.length - 1
    const moves: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }
    const target = moves[e.key] ?? -1
    if (target < 0) return
    e.preventDefault()
    setTab(tabs[target].key)
    tabRefs.current[target]?.focus()
  }

  return (
    <div
      className={cn(
        'glass flex items-center gap-2 px-4 py-2.5 rounded-full max-w-lg w-full focus-within:ring-2 focus-within:ring-black/40',
        className
      )}
    >
      {isPending ? (
        <Loader2
          size={15}
          className="text-black/40 shrink-0 animate-spin"
          data-testid="search-spinner"
          aria-hidden="true"
        />
      ) : (
        <Search
          size={15}
          className="text-black/40 shrink-0"
          data-testid="search-icon"
          aria-hidden="true"
        />
      )}
      <label htmlFor="global-search" className="sr-only">
        {t('artists.searchPlaceholder')}
      </label>
      <input
        id="global-search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
        }}
        placeholder={t('artists.searchPlaceholder')}
        className="flex-1 bg-transparent text-sm outline-none text-black placeholder:text-black/30 min-w-0"
      />
      <div className="flex gap-1 shrink-0" role="tablist">
        {tabs.map(({ key, label }, i) => (
          <button
            key={key}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            onKeyDown={(e) => {
              onTabKeyDown(e, i)
            }}
            tabIndex={tab === key ? 0 : -1}
            onClick={() => {
              setTab(key)
            }}
            role="tab"
            aria-selected={tab === key}
            className={cn(
              'text-[11px] px-2.5 py-1 rounded-full transition-colors font-medium',
              tab === key
                ? 'bg-black text-white'
                : 'text-black/40 hover:text-black hover:bg-black/5'
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
