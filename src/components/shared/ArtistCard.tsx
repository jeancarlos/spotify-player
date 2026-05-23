import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
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
      className="cursor-pointer focus:outline-none group"
      onClick={() => navigate(`/artists/${artist.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/artists/${artist.id}`)}
      aria-label={`Ver artista ${artist.name}`}
    >
      <div
        className={cn(
          'relative aspect-square overflow-hidden transition-all duration-200',
          'rounded-[14px] shadow-lg group-hover:shadow-xl',
          'ring-1 ring-white/10',
          'group-hover:scale-105 group-active:scale-95',
        )}
      >
        {image ? (
          <img
            src={image}
            alt={artist.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-black/20 flex items-center justify-center text-4xl text-white/20">
            ♪
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 px-2 pb-1.5">
          <p className="text-[9px] font-semibold text-white truncate leading-tight drop-shadow">
            {artist.name}
          </p>
          {artist.followers?.total != null && (
            <p className="text-[8px] text-white/60 truncate leading-tight">
              {artist.followers.total.toLocaleString()} {t('artists.followers')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
