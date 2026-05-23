import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useArtists } from '@/hooks/queries/useArtists'
import { useSearchAlbums } from '@/hooks/queries/useSearchAlbums'
import { ArtistCard } from '@/components/shared/ArtistCard'
import { SearchBar } from '@/components/shared/SearchBar'
import { Pagination } from '@/components/shared/Pagination'
import type { SearchTab } from '@/components/shared/SearchBar'

export function Artists() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialQuery = searchParams.get('q') ?? ''
  const initialTab = (searchParams.get('tab') as SearchTab) ?? 'artista'

  const [query, setQuery] = useState(initialQuery)
  const [tab, setTab] = useState<SearchTab>(initialTab)
  const [page, setPage] = useState(1)

  const artists = useArtists(tab === 'artista' ? query : '', page)
  const albums = useSearchAlbums(tab === 'album' ? query : '', page)

  const isArtist = tab === 'artista'
  const data = isArtist ? artists.data : albums.data
  const isLoading = isArtist ? artists.isPending : albums.isPending
  const hasNext = data ? (data.offset + data.limit) < data.total : false

  const handleSearch = useCallback((q: string, t: SearchTab) => {
    setQuery(q)
    setTab(t)
    setPage(1)
    setSearchParams({ q, tab: t })
  }, [setSearchParams])

  useEffect(() => {
    setPage(1)
  }, [query, tab])

  return (
    <div className="min-h-screen">
      {/* SearchBar */}
      <div className="fixed top-14 left-0 right-0 z-20 flex justify-center px-4 pt-2">
        <SearchBar onSearch={handleSearch} defaultTab={tab} className="shadow-sm" />
      </div>

      <div className="pt-36 px-6 pb-24">
        {/* Results header */}
        {query && (
          <p className="text-sm text-black/40 mb-4">
            {isArtist ? t('artists.searchArtists') : t('artists.searchAlbums')}
            {data && ` — ${data.total} resultados`}
          </p>
        )}

        {/* Empty state */}
        {!query && (
          <p className="text-center text-black/30 mt-20">{t('artists.searchPrompt')}</p>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card aspect-square animate-pulse" />
            ))}
          </div>
        )}

        {/* Artist grid */}
        {!isLoading && isArtist && artists.data && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {artists.data.items.map(artist => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        )}

        {/* Album grid */}
        {!isLoading && !isArtist && albums.data && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {albums.data.items.map(album => (
              <div key={album.id} className="glass-card overflow-hidden cursor-pointer group">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={album.images[0]?.url}
                    alt={album.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-black truncate">{album.name}</p>
                  <p className="text-xs text-black/50 truncate">
                    {album.artists.map((a: { name: string }) => a.name).join(', ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {!isLoading && query && data?.items.length === 0 && (
          <p className="text-center text-black/30 mt-20">{t('artists.noResults')}</p>
        )}

        {/* Pagination */}
        {data && data.items.length > 0 && (
          <Pagination
            page={page}
            hasNext={hasNext}
            onPrev={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => p + 1)}
            className="mt-8"
          />
        )}
      </div>
    </div>
  )
}
