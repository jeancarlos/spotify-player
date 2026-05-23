import { Play } from 'lucide-react'
import { formatDuration } from '@/utils/formatDuration'
import { cn } from '@/lib/utils'
import type { SpotifyTrack } from '@/types/spotify'

interface TrackRowProps {
  track: SpotifyTrack
  index?: number
  isActive?: boolean
  onPlay?: (track: SpotifyTrack) => void
}

export function TrackRow({ track, index, isActive = false, onPlay }: TrackRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-black/5 transition-colors group cursor-pointer',
        isActive && 'bg-black/8'
      )}
      onClick={() => onPlay?.(track)}
      role="row"
    >
      {index !== undefined && (
        <span className="w-6 text-xs text-black/30 text-right shrink-0 group-hover:hidden">
          {index + 1}
        </span>
      )}
      <button
        className={cn(
          'w-6 shrink-0 items-center justify-center hidden group-hover:flex',
          index === undefined && 'flex'
        )}
        aria-label={`Tocar ${track.name}`}
      >
        <Play size={12} className="fill-black text-black" />
      </button>

      <img
        src={track.album.images[0]?.url}
        alt={track.album.name}
        className="w-9 h-9 rounded-lg object-cover shrink-0"
      />

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', isActive ? 'text-black' : 'text-black/80')}>
          {track.name}
        </p>
        <p className="text-xs text-black/40 truncate">
          {track.artists.map(a => a.name).join(', ')}
        </p>
      </div>

      <span className="text-xs text-black/30 shrink-0 ml-2">
        {formatDuration(track.duration_ms)}
      </span>
    </div>
  )
}
