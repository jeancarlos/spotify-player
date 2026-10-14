import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MediaCard } from '@/components/shared/MediaCard'
import type { Artist, AlbumSimple, Playlist } from '@/types/music'
import type { SearchTab } from '@/utils/search'

interface SearchResultsGridProps {
  tab: SearchTab
  artists?: Artist[]
  albums?: AlbumSimple[]
  playlists?: (Playlist | null)[]
}

export function SearchResultsGrid({ tab, artists, albums, playlists }: SearchResultsGridProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3">
      {tab === 'artist' &&
        artists?.map((artist) => (
          <MediaCard
            key={artist.id}
            title={artist.name}
            images={artist.images}
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
            images={album.images}
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
              images={playlist.images}
              subtitle={playlist.owner?.display_name}
              onClick={() => {
                navigate(`/playlists/${playlist.id}`)
              }}
            />
          ))}
    </div>
  )
}
