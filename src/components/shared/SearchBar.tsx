import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'
import { saveLastSearch } from '@/utils/search'
import type { SearchTab } from '@/utils/search'

interface SearchBarProps {
  onSearch: (query: string, tab: SearchTab) => void
  defaultTab?: SearchTab
  defaultQuery?: string
  className?: string
}

export function SearchBar({
  onSearch,
  defaultTab = 'artista',
  defaultQuery = '',
  className,
}: SearchBarProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState(defaultQuery)
  const [tab, setTab] = useState<SearchTab>(defaultTab)
  const debouncedQuery = useDebounce(query, 400)
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    saveLastSearch(debouncedQuery, tab)
    onSearch(debouncedQuery, tab)
  }, [debouncedQuery, tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const tabs: { key: SearchTab; label: string }[] = [
    { key: 'artista', label: t('artists.tabArtist') },
    { key: 'album', label: t('artists.tabAlbum') },
    { key: 'playlist', label: t('artists.tabPlaylist') },
  ]

  return (
    <div
      className={cn(
        'glass flex items-center gap-2 px-4 py-2.5 rounded-full max-w-lg w-full',
        className
      )}
    >
      <Search size={15} className="text-black/40 shrink-0" />
      <label htmlFor="global-search" className="sr-only">
        {t('artists.searchPlaceholder')}
      </label>
      <input
        id="global-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('artists.searchPlaceholder')}
        className="flex-1 bg-transparent text-sm outline-none text-black placeholder:text-black/30 min-w-0"
      />
      <div className="flex gap-1 shrink-0" role="tablist">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
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
