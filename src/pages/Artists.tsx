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
    <div className="min-h-screen">
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

            {isAlbum &&
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

            {hasNext && (
              <button
                onClick={() => handlePageChange(page + 1)}
                className="aspect-square rounded-[6px] border border-dashed border-black/20 bg-black/[0.03] hover:bg-black/[0.07] hover:border-black/35 transition-all duration-200 hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-1.5 group"
                aria-label={t('artists.next')}
              >
                <ChevronRight
                  size={18}
                  className="text-black/30 group-hover:text-black/55 transition-colors"
                />
                <span className="text-[8px] font-semibold text-black/30 group-hover:text-black/55 transition-colors uppercase tracking-wider leading-none">
                  {t('artists.next')}
                </span>
              </button>
            )}
          </div>
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
