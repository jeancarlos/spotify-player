import { useTranslation } from 'react-i18next'
import { MediaCard } from './MediaCard'
import type { SpotifyArtist } from '@/types/spotify'

interface ArtistCardProps {
  artist: SpotifyArtist
  onNavigate?: (id: string) => void
}

export function ArtistCard({ artist, onNavigate }: ArtistCardProps) {
  const { t } = useTranslation()
  const imageUrl = artist.images[0]?.url

  const handleClick = () => {
    if (onNavigate) onNavigate(artist.id)
  }

  const subtitle = artist.followers?.total != null
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
