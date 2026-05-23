import { useCallback, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useArtists } from '@/hooks/queries/useArtists'
import { useSearchAlbums } from '@/hooks/queries/useSearchAlbums'
import { useSearchPlaylists } from '@/hooks/queries/useSearchPlaylists'
import { Play } from 'lucide-react'
import { ArtistCard } from '@/components/shared/ArtistCard'
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
  const data = isArtist ? artists.data : isPlaylist ? playlists.data : albums.data
  const isLoading = isArtist ? artists.isPending : isPlaylist ? playlists.isPending : albums.isPending
  const hasNext = data ? (data.offset + data.items.length) < data.total : false

  const handleSearch = useCallback((q: string, t: SearchTab) => {
    if (!q.trim()) { navigate('/', { replace: true }); return }
    setSearchParams({ q, tab: t, page: '1' }, { replace: true })
  }, [navigate, setSearchParams])

  const handlePageChange = (newPage: number) => {
    setSearchParams({ q: query, tab, page: String(newPage) }, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const headerLabel = isArtist
    ? t('artists.searchArtists')
    : isPlaylist
    ? t('artists.searchPlaylists')
    : t('artists.searchAlbums')

  return (
    <div className="min-h-screen">
      {/* SearchBar */}
      <div className="fixed top-14 left-0 right-0 z-20 flex justify-center px-4 pt-2">
        <SearchBar onSearch={handleSearch} defaultTab={tab} defaultQuery={query} className="shadow-sm" />
      </div>

      <div className="pt-36 px-6 pb-32">
        {/* Results header */}
        {query && (
          <p className="text-sm text-black/40 mb-6">
            {headerLabel}
            {data && ` — ${data.total} resultados`}
          </p>
        )}

        {/* Empty state */}
        {!query && (
          <p className="text-center text-black/30 mt-20">{t('artists.searchPrompt')}</p>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3">
            {Array.from({ length: 21 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Artist grid */}
        {!isLoading && isArtist && artists.data && (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3">
            {artists.data.items.map(artist => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        )}

        {/* Album grid */}
        {!isLoading && tab === 'album' && albums.data && (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3">
            {albums.data.items.map(album => (
              <div
                key={album.id}
                className="cursor-pointer focus:outline-none group"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/albums/${album.id}`)}
                onKeyDown={e => e.key === 'Enter' && navigate(`/albums/${album.id}`)}
              >
                <div className="relative aspect-square overflow-hidden rounded-[14px] shadow-lg group-hover:shadow-xl ring-1 ring-white/10 transition-all duration-200 group-hover:scale-105 group-active:scale-95">
                  <img
                    src={album.images[0]?.url}
                    alt={album.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <Play size={14} className="text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 px-2 pb-1.5">
                    <p className="text-[9px] font-semibold text-white truncate leading-tight drop-shadow">{album.name}</p>
                    <p className="text-[8px] text-white/60 truncate leading-tight">
                      {album.artists.map((a: { name: string }) => a.name).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Playlist grid */}
        {!isLoading && isPlaylist && playlists.data && (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3">
            {playlists.data.items.filter((p): p is NonNullable<typeof p> => !!p).map(playlist => (
              <div
                key={playlist.id}
                className="cursor-pointer focus:outline-none group"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/playlists/${playlist.id}`)}
                onKeyDown={e => e.key === 'Enter' && navigate(`/playlists/${playlist.id}`)}
              >
                <div className="relative aspect-square overflow-hidden rounded-[14px] shadow-lg group-hover:shadow-xl ring-1 ring-white/10 transition-all duration-200 group-hover:scale-105 group-active:scale-95">
                  {playlist.images[0]?.url ? (
                    <img
                      src={playlist.images[0].url}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full bg-black/20 flex items-center justify-center text-white/20 text-4xl">♫</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <Play size={14} className="text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 px-2 pb-1.5">
                    <p className="text-[9px] font-semibold text-white truncate leading-tight drop-shadow">{playlist.name}</p>
                    <p className="text-[8px] text-white/60 truncate leading-tight">{playlist.owner.display_name}</p>
                  </div>
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
            onPrev={() => handlePageChange(Math.max(1, page - 1))}
            onNext={() => handlePageChange(page + 1)}
            className="mt-12"
          />
        )}
      </div>
    </div>
  )
}
