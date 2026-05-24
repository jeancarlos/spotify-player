import { useCallback, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useArtists } from '@/hooks/queries/useArtists'
import { useSearchAlbums } from '@/hooks/queries/useSearchAlbums'
import { useSearchPlaylists } from '@/hooks/queries/useSearchPlaylists'
import { CardSkeleton } from '@/components/shared/CardSkeleton'
import { SearchBar } from '@/components/shared/SearchBar'
import { Pagination } from '@/components/shared/Pagination'
import { SearchResultsGrid } from '@/components/search/SearchResultsGrid'
import { loadLastSearch } from '@/utils/search'
import type { SearchTab } from '@/utils/search'

export function Artists() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const saved = loadLastSearch()
  const query = searchParams.get('q') ?? saved?.q ?? ''
  const tab = (searchParams.get('tab') as SearchTab) ?? saved?.tab ?? 'artist'
  const page = Number(searchParams.get('page') ?? '1')

  const isArtist = tab === 'artist'
  const isAlbum = tab === 'album'
  const isPlaylist = tab === 'playlist'

  useEffect(() => {
    if (!query.trim()) navigate('/', { replace: true })
  }, [query, navigate])

  // Todos os hooks são chamados incondicionalmente — query vazia desabilita o fetch via `enabled`
  const artists = useArtists(isArtist ? query : '', page)
  const albums = useSearchAlbums(isAlbum ? query : '', page)
  const playlists = useSearchPlaylists(isPlaylist ? query : '', page)

  const activeQuery = {
    artist: artists,
    playlist: playlists,
    album: albums,
  }[tab]
  const { data, isPending: isLoading } = activeQuery
  const hasNext = data ? data.offset + data.items.length < data.total : false

  const headerLabel = {
    artist: t('artists.searchArtists'),
    playlist: t('artists.searchPlaylists'),
    album: t('artists.searchAlbums'),
  }[tab]

  const handleSearch = useCallback(
    (q: string, nextTab: SearchTab) => {
      if (!q.trim()) {
        navigate('/', { replace: true })
        return
      }
      setSearchParams({ q, tab: nextTab, page: '1' }, { replace: true })
    },
    [navigate, setSearchParams]
  )

  const handlePageChange = (newPage: number) => {
    setSearchParams({ q: query, tab, page: String(newPage) }, { replace: true })
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen max-w-3xl mx-auto ">
      <div className="fixed top-14 left-0 right-0 z-20 flex justify-center px-4 pt-2">
        <SearchBar
          onSearch={handleSearch}
          defaultTab={tab}
          defaultQuery={query}
          className="shadow-sm"
        />
      </div>

      <div className="pt-36 px-6 pb-32">
        {query && (
          <p className="text-sm text-black/40 mb-6" aria-live="polite">
            {headerLabel}
            {data && ` — ${t('artists.result', { count: data.total })}`}
          </p>
        )}

        {!query && (
          <p className="text-center text-black/30 mt-20">{t('artists.searchPrompt')}</p>
        )}

        {isLoading && (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3">
            {Array.from({ length: 21 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && data && (
          <SearchResultsGrid
            tab={tab}
            artists={artists.data?.items}
            albums={albums.data?.items}
            playlists={playlists.data?.items}
            hasNext={hasNext}
            onNextPage={() => handlePageChange(page + 1)}
          />
        )}

        {!isLoading && query && data?.items.length === 0 && (
          <p className="text-center text-black/30 mt-20">{t('artists.noResults')}</p>
        )}

        {data && data.items.length > 0 && (
          <Pagination
            page={page}
            hasNext={hasNext}
            onPrev={() => handlePageChange(Math.max(1, page - 1))}
            onNext={() => handlePageChange(page + 1)}
            className="mt-12"
          />
        )}
      </div>
    </div>
  )
}
