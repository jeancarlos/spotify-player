import { Play } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { formatDuration } from '@/utils/formatDuration'
import type { SpotifyTrack } from '@/types/spotify'

interface TrackCardProps {
  track: SpotifyTrack
  onPlay?: (track: SpotifyTrack) => void
}

export function TrackCard({ track, onPlay }: TrackCardProps) {
  const image = track.album.images[0]?.url

  return (
    <GlassCard className="w-40 flex flex-col gap-2 group shrink-0" onClick={() => onPlay?.(track)}>
      <div className="relative w-full aspect-square rounded-xl overflow-hidden">
        {image && (
          <img src={image} alt={track.album.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play size={28} className="text-white fill-white" />
        </div>
      </div>
      <div className="overflow-hidden">
        <p className="text-xs font-bold truncate">{track.name}</p>
        <p className="text-xs text-white/50 truncate">
          {track.artists.map(a => a.name).join(', ')}
        </p>
        <p className="text-xs text-white/30 mt-1">{formatDuration(track.duration_ms)}</p>
      </div>
    </GlassCard>
  )
}
