import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { SpotifyArtist } from '@/types/spotify'

interface ArtistCardProps {
  artist: SpotifyArtist
}

export function ArtistCard({ artist }: ArtistCardProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const image = artist.images[0]?.url

  return (
    <div
      className="glass-card cursor-pointer overflow-hidden group"
      onClick={() => navigate(`/artists/${artist.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/artists/${artist.id}`)}
      aria-label={`Ver artista ${artist.name}`}
    >
      <div className="aspect-square overflow-hidden bg-black/5">
        {image ? (
          <img
            src={image}
            alt={artist.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-black/20">
            ♪
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-bold text-sm text-black truncate">{artist.name}</p>
        <p className="text-xs text-black/50 mt-0.5">
          {artist.followers.total.toLocaleString()} {t('artists.followers')}
        </p>
        {artist.genres[0] && (
          <p className="text-[11px] text-black/40 mt-0.5 truncate">{artist.genres[0]}</p>
        )}
      </div>
    </div>
  )
}
