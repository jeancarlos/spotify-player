import { useCallback, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { useArtists } from '@/hooks/queries/useArtists'
import { useSearchAlbums } from '@/hooks/queries/useSearchAlbums'
import { useSearchPlaylists } from '@/hooks/queries/useSearchPlaylists'
import { MediaCard } from '@/components/shared/MediaCard'
import { CardSkeleton } from '@/components/shared/CardSkeleton'
import { SearchBar } from '@/components/shared/SearchBar'
import { Pagination } from '@/components/shared/Pagination'
import { loadLastSearch } from '@/utils/search'
import type { SearchTab } from '@/utils/search'

export function Artists() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const saved = loadLastSearch()
  const query = searchParams.get('q') ?? saved?.q ?? ''
  const tab = (searchParams.get('tab') as SearchTab) ?? saved?.tab ?? 'artista'
  const page = Number(searchParams.get('page') ?? '1')

  useEffect(() => {
    if (!query.trim()) navigate('/', { replace: true })
  }, [query, navigate])

  const artists = useArtists(tab === 'artista' ? query : '', page)
  const albums = useSearchAlbums(tab === 'album' ? query : '', page)
  const playlists = useSearchPlaylists(tab === 'playlist' ? query : '', page)

  const isArtist = tab === 'artista'
  const isPlaylist = tab === 'playlist'

  // Refactor nested ternaries into clearer derivations
  const getSearchData = () => {
    if (isArtist) return artists
    if (isPlaylist) return playlists
    return albums
  }

  const { data, isPending: isLoading } = getSearchData()
  const hasNext = data ? data.offset + data.items.length < data.total : false

  const handleSearch = useCallback(
    (q: string, t: SearchTab) => {
      if (!q.trim()) {
        navigate('/', { replace: true })
        return
      }
      setSearchParams({ q, tab: t, page: '1' }, { replace: true })
    },
    [navigate, setSearchParams]
  )

  const handlePageChange = (newPage: number) => {
    setSearchParams({ q: query, tab, page: String(newPage) }, { replace: true })
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getHeaderLabel = () => {
    if (isArtist) return t('artists.searchArtists')
    if (isPlaylist) return t('artists.searchPlaylists')
    return t('artists.searchAlbums')
  }

  const headerLabel = getHeaderLabel()

  return (
    <div className="min-h-screen">
      {/* SearchBar */}
      <div className="fixed top-14 left-0 right-0 z-20 flex justify-center px-4 pt-2">
        <SearchBar
          onSearch={handleSearch}
          defaultTab={tab}
          defaultQuery={query}
          className="shadow-sm"
        />
      </div>

      <div className="pt-36 px-6 pb-32">
        {/* Results header */}
        {query && (
          <p className="text-sm text-black/40 mb-6" aria-live="polite">
            {headerLabel}
            {data && ` — ${t('artists.result', { count: data.total })}`}
          </p>
        )}

        {/* Empty state */}
        {!query && <p className="text-center text-black/30 mt-20">{t('artists.searchPrompt')}</p>}

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3">
            {Array.from({ length: 21 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Results grid */}
        {!isLoading && data && (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3">
            {isArtist &&
              artists.data?.items.map((artist) => (
                <MediaCard
                  key={artist.id}
                  title={artist.name}
                  imageUrl={artist.images[0]?.url}
                  subtitle={
                    artist.followers?.total != null
                      ? t('artists.followers', { count: artist.followers.total })
                      : undefined
                  }
                  onClick={() => navigate(`/artists/${artist.id}`)}
                />
              ))}

            {tab === 'album' &&
              albums.data?.items.map((album) => (
                <MediaCard
                  key={album.id}
                  title={album.name}
                  imageUrl={album.images[0]?.url}
                  subtitle={album.artists.map((a: { name: string }) => a.name).join(', ')}
                  onClick={() => navigate(`/albums/${album.id}`)}
                />
              ))}

            {isPlaylist &&
              playlists.data?.items
                .filter((p): p is NonNullable<typeof p> => !!p)
                .map((playlist) => (
                  <MediaCard
                    key={playlist.id}
                    title={playlist.name}
                    imageUrl={playlist.images[0]?.url}
                    subtitle={playlist.owner.display_name}
                    onClick={() => navigate(`/playlists/${playlist.id}`)}
                  />
                ))}

            {/* 21º slot — card de próxima página */}
            {hasNext && (
              <button
                onClick={() => handlePageChange(page + 1)}
                className="aspect-square rounded-[6px] bg-black/4 hover:bg-black/8 ring-1 ring-black/6 transition-all duration-200 hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-1 group"
                aria-label={t('artists.next')}
              >
                <ChevronRight
                  size={20}
                  className="text-black/25 group-hover:text-black/50 transition-colors"
                />
                <span className="text-[8px] font-semibold text-black/25 group-hover:text-black/50 transition-colors uppercase tracking-wider">
                  {t('artists.next')}
                </span>
              </button>
            )}
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
            onPrev={() => handlePageChange(Math.max(1, page - 1))}
            onNext={() => handlePageChange(page + 1)}
            className="mt-12"
          />
        )}
      </div>
    </div>
  )
}
