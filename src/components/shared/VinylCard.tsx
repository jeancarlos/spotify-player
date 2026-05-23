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
  const dim = size === 'sm' ? 80 : 104

  return (
    <div
      className="cursor-pointer flex flex-col items-center gap-1"
      style={{ width: dim }}
      onClick={() => onPlay?.(track)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onPlay?.(track)}
      aria-label={`Tocar ${track.name}`}
    >
      <div
        className={cn(
          'glass-card overflow-hidden shrink-0',
          isActive && 'ring-2 ring-black/30'
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
      <div className="w-full px-0.5">
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
