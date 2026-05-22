import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { useArtists } from '@/hooks/queries/useArtists'
import { useSearchAlbums } from '@/hooks/queries/useSearchAlbums'
import { useDebounce } from '@/hooks/useDebounce'
import { ArtistCard } from '@/components/shared/ArtistCard'
import { AlbumCard } from '@/components/shared/AlbumCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function Artists() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [mode, setMode] = useState<'artist' | 'album'>('artist')
  const [activeGenre, setActiveGenre] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, 400)

  const artists = useArtists(debouncedQuery, page)
  const albums = useSearchAlbums(debouncedQuery, page)

  const genres = useMemo(() => {
    if (!artists.data) return []
    const all = artists.data.items.flatMap(a => a.genres)
    return [...new Set(all)].slice(0, 12)
  }, [artists.data])

  const filteredArtists = useMemo(() => {
    if (!artists.data) return []
    if (!activeGenre) return artists.data.items
    return artists.data.items.filter(a => a.genres.includes(activeGenre))
  }, [artists.data, activeGenre])

  const isLoading = mode === 'artist' ? artists.isPending : albums.isPending
  const isEmpty = debouncedQuery.trim() === ''

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setPage(1)
    setActiveGenre(null)
  }

  function switchMode(next: 'artist' | 'album') {
    setMode(next)
    setPage(1)
    setActiveGenre(null)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Search bar + mode toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-lg">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder={t('artists.searchPlaceholder')}
            className="glass-input w-full pl-9 pr-4 py-2.5 text-sm rounded-xl text-white placeholder:text-white/30"
          />
        </div>
        <div className="flex glass-card-md rounded-xl overflow-hidden">
          <button
            onClick={() => switchMode('artist')}
            className={cn('px-3 py-2 text-xs transition-colors', mode === 'artist' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white')}
          >
            {t('artists.searchArtists')}
          </button>
          <button
            onClick={() => switchMode('album')}
            className={cn('px-3 py-2 text-xs transition-colors', mode === 'album' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white')}
          >
            {t('artists.searchAlbums')}
          </button>
        </div>
      </div>

      {/* Genre filter chips (only in artist mode) */}
      {mode === 'artist' && genres.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            onClick={() => setActiveGenre(null)}
            className={cn('cursor-pointer text-xs', !activeGenre && 'bg-white/15')}
          >
            {t('artists.all')}
          </Badge>
          {genres.map(g => (
            <Badge
              key={g}
              variant="outline"
              onClick={() => setActiveGenre(g === activeGenre ? null : g)}
              className={cn('cursor-pointer text-xs capitalize', activeGenre === g && 'bg-white/15')}
            >
              {g}
            </Badge>
          ))}
        </div>
      )}

      {/* Results */}
      {isEmpty ? (
        <p className="text-white/40 text-sm text-center py-16">{t('artists.searchPrompt')}</p>
      ) : isLoading ? (
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="w-44 h-64 rounded-2xl" />
          ))}
        </div>
      ) : mode === 'artist' ? (
        <>
          {filteredArtists.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-16">{t('artists.noResults')}</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {filteredArtists.map(artist => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-wrap gap-4">
          {(albums.data?.items ?? []).map(album => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isEmpty && !isLoading && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-1.5 glass-button rounded-lg text-sm disabled:opacity-30"
          >
            ← {t('artists.previous')}
          </button>
          <span className="text-sm text-white/50">{page}</span>
          <button
            disabled={mode === 'artist' ? !artists.data?.next : !albums.data?.next}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-1.5 glass-button rounded-lg text-sm disabled:opacity-30"
          >
            {t('artists.next')} →
          </button>
        </div>
      )}
    </div>
  )
}
