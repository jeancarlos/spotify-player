import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { SpotifyTrack } from '@/types/spotify'

interface VinylCardProps {
  track: SpotifyTrack
  isActive?: boolean
  onPlay?: (track: SpotifyTrack) => void
  size?: 'sm' | 'md'
}

export function VinylCard({
  track,
  isActive = false,
  onPlay,
  size = 'md',
}: VinylCardProps) {
  const { t } = useTranslation()
  const dim = size === 'sm' ? 80 : 104

  return (
    <div
      className="cursor-pointer flex flex-col items-center gap-1 focus:outline-none"
      style={{ width: dim }}
      onClick={() => onPlay?.(track)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onPlay?.(track)}
      aria-label={t('player.playTrack', { name: track.name })}
    >
      <div
        className={cn(
          'glass-card overflow-hidden shrink-0 transition-transform hover:scale-105 active:scale-95',
          isActive && 'ring-2 ring-black/30 scale-105'
        )}
        style={{ width: dim, height: dim, borderRadius: 14 }}
      >
        <img
          src={track.album.images[0]?.url ?? ''}
          alt={track.album.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>
      <div className="w-full mt-1 bg-white/70 backdrop-blur-sm rounded-lg px-1.5 py-1">
        <p className="text-[9px] font-semibold truncate text-center text-black/80">
          {track.name}
        </p>
        <p className="text-[8px] truncate text-center text-black/50">
          {track.artists.map(a => a.name).join(', ')}
        </p>
      </div>
    </div>
  )
}
