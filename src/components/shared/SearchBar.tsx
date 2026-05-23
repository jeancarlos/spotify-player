import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'

export type SearchTab = 'artista' | 'album' | 'playlist'

interface SearchBarProps {
  onSearch: (query: string, tab: SearchTab) => void
  defaultTab?: SearchTab
  className?: string
}

export function SearchBar({ onSearch, defaultTab = 'artista', className }: SearchBarProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<SearchTab>(defaultTab)
  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    onSearch(debouncedQuery, tab)
  }, [debouncedQuery, tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const tabs: SearchTab[] = ['artista', 'album', 'playlist']

  return (
    <div className={cn('glass flex items-center gap-2 px-4 py-2.5 rounded-full max-w-lg w-full', className)}>
      <Search size={15} className="text-black/40 shrink-0" />
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={t('artists.searchPlaceholder')}
        className="flex-1 bg-transparent text-sm outline-none text-black placeholder:text-black/30 min-w-0"
      />
      <div className="flex gap-1 shrink-0">
        {tabs.map(tabKey => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={cn(
              'text-[11px] px-2.5 py-1 rounded-full transition-colors font-medium',
              tab === tabKey
                ? 'bg-black text-white'
                : 'text-black/40 hover:text-black hover:bg-black/5'
            )}
          >
            {tabKey}
          </button>
        ))}
      </div>
    </div>
  )
}
