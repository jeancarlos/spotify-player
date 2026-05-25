import { useTranslation } from 'react-i18next'
import { MediaCard } from './MediaCard'
import type { SpotifyArtist } from '@/types/spotify'

interface ArtistCardProps {
  artist: SpotifyArtist
  onArtistSelect?: (artistId: string) => void
}

export function ArtistCard({ artist, onArtistSelect }: ArtistCardProps) {
  const { t } = useTranslation()
  const imageUrl = artist.images[0]?.url

  const handleClick = () => {
    if (onArtistSelect) onArtistSelect(artist.id)
  }

  const subtitle =
    artist.followers?.total != null
      ? t('artists.followers', { count: artist.followers.total })
      : undefined

  return (
    <MediaCard
      title={artist.name}
      imageUrl={imageUrl}
      subtitle={subtitle}
      onClick={handleClick}
      ariaLabel={`Ver artista ${artist.name}`}
    />
  )
}
