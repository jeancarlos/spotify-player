import { Play } from 'lucide-react'
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
  const dim = size === 'sm' ? 84 : 112

  return (
    <div
      className="cursor-pointer shrink-0 focus:outline-none group"
      style={{ width: dim }}
      onClick={() => onPlay?.(track)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onPlay?.(track)}
      aria-label={t('player.playTrack', { name: track.name })}
    >
      <div
        className={cn(
          'relative overflow-hidden transition-all duration-200',
          'shadow-lg group-hover:shadow-xl',
          'group-hover:scale-105 group-active:scale-95',
          isActive
            ? 'ring-2 ring-[#1DB954] scale-105 shadow-[0_0_18px_rgba(29,185,84,0.45)]'
            : 'ring-1 ring-white/10',
        )}
        style={{ width: dim, height: dim, borderRadius: 14 }}
      >
        {/* Album art */}
        <img
          src={track.album.images[0]?.url ?? ''}
          alt={track.album.name}
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        {/* Play icon on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <Play size={14} className="text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Active sound bars */}
        {isActive && (
          <div className="absolute top-2 right-2 flex items-end gap-[2px] h-3">
            {[0, 150, 300].map(delay => (
              <span
                key={delay}
                className="w-[3px] rounded-full bg-[#1DB954]"
                style={{
                  height: '100%',
                  animation: `soundBar 0.8s ease-in-out infinite alternate`,
                  animationDelay: `${delay}ms`,
                }}
              />
            ))}
          </div>
        )}

        {/* Text at bottom */}
        <div className="absolute inset-x-0 bottom-0 px-2 pb-1.5">
          <p className="text-[9px] font-semibold text-white truncate leading-tight drop-shadow">
            {track.name}
          </p>
          <p className="text-[8px] text-white/60 truncate leading-tight">
            {track.artists.map(a => a.name).join(', ')}
          </p>
        </div>
      </div>
    </div>
  )
}
