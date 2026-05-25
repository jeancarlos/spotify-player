import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { MediaCard } from '@/components/shared/MediaCard'
import type { SpotifyArtist, SpotifyAlbumSimple, SpotifyPlaylist } from '@/types/spotify'
import type { SearchTab } from '@/utils/search'

interface SearchResultsGridProps {
  tab: SearchTab
  artists?: SpotifyArtist[]
  albums?: SpotifyAlbumSimple[]
  playlists?: (SpotifyPlaylist | null)[]
  hasNext: boolean
  onNextPage: () => void
}

export function SearchResultsGrid({
  tab,
  artists,
  albums,
  playlists,
  hasNext,
  onNextPage,
}: SearchResultsGridProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3">
      {tab === 'artist' &&
        artists?.map((artist) => (
          <MediaCard
            key={artist.id}
            title={artist.name}
            imageUrl={artist.images[0]?.url}
            subtitle={
              artist.followers?.total != null
                ? t('artists.followers', { count: artist.followers.total })
                : undefined
            }
            onClick={() => {
              navigate(`/artists/${artist.id}`)
            }}
          />
        ))}

      {tab === 'album' &&
        albums?.map((album) => (
          <MediaCard
            key={album.id}
            title={album.name}
            imageUrl={album.images[0]?.url}
            subtitle={album.artists.map((a) => a.name).join(', ')}
            onClick={() => {
              navigate(`/albums/${album.id}`)
            }}
          />
        ))}

      {tab === 'playlist' &&
        playlists
          ?.filter((p): p is NonNullable<typeof p> => !!p)
          .map((playlist) => (
            <MediaCard
              key={playlist.id}
              title={playlist.name}
              imageUrl={playlist.images[0]?.url}
              subtitle={playlist.owner.display_name}
              onClick={() => {
                navigate(`/playlists/${playlist.id}`)
              }}
            />
          ))}

      {hasNext && (
        <button
          onClick={onNextPage}
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
  )
}
