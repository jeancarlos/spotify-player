import { useState } from 'react'
import { Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDuration } from '@/utils/formatDuration'
import { cn } from '@/lib/utils'
import type { SpotifyTrack } from '@/types/spotify'

interface TrackRowProps {
  track: SpotifyTrack
  index: number
  onPlay?: (track: SpotifyTrack) => void
}

export function TrackRow({ track, index, onPlay }: TrackRowProps) {
  const [hovered, setHovered] = useState(false)
  const { t } = useTranslation()
  const image = track.album.images[0]?.url

  return (
    <div
      className={cn(
        'grid grid-cols-[2rem_3rem_1fr_4rem_4rem] items-center gap-3 px-3 py-2 rounded-xl transition-colors',
        'hover:bg-white/5 cursor-pointer group'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onPlay?.(track)}
    >
      <span className="text-xs text-white/40 text-right">
        {hovered ? <Play size={14} className="fill-white text-white ml-auto" /> : index + 1}
      </span>
      {image && (
        <img src={image} alt={track.album.name} className="w-10 h-10 rounded object-cover" />
      )}
      <div className="overflow-hidden">
        <p className="text-sm font-bold truncate">{track.name}</p>
        <p className="text-xs text-white/50 truncate">
          {track.artists.map(a => a.name).join(', ')}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <div
          className="h-1 bg-white/20 rounded-full overflow-hidden w-16"
          title={`${t('trackRow.popularity')}: ${track.popularity}`}
        >
          <div
            className="h-full bg-white/60 rounded-full"
            style={{ width: `${track.popularity}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-white/40 text-right">{formatDuration(track.duration_ms)}</span>
    </div>
  )
}
