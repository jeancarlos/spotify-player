import { useTranslation } from 'react-i18next'
import { Play } from 'lucide-react'
import { usePlayer } from '@/hooks/usePlayer'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { formatDuration } from '@/utils/formatDuration'

export function PlayerQueue() {
  const { t } = useTranslation()
  const { state } = usePlayer()
  const playTrack = usePlayTrack()
  const { queue, currentTrack } = state

  // Spotify sometimes echoes the current track as queue[0]; remove only that first duplicate
  const filteredQueue = queue[0]?.uri === currentTrack?.uri ? queue.slice(1) : queue

  if (filteredQueue.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <p className="text-white/30 text-sm">{t('player.emptyQueue', 'A fila está vazia')}</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4 pb-32">
      <div className="max-w-md mx-auto">
        <h3 className="text-[10px] text-white/25 uppercase tracking-[0.2em] font-bold mb-4 text-center">
          {t('player.nextUp')}
        </h3>
        <div className="space-y-0.5">
          {filteredQueue.map((track, i) => (
            <div
              key={`${track.uri}-${i}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group focus:outline-none"
              onClick={() => playTrack(track)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  playTrack(track)
                }
              }}
            >
              <div className="relative shrink-0">
                <img
                  src={track.album.images[0]?.url}
                  className="w-9 h-9 rounded-lg object-cover"
                  alt=""
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-lg">
                  <Play size={12} className="fill-white text-white" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white/80 group-hover:text-white truncate transition-colors">
                  {track.name}
                </p>
                <p className="text-xs text-white/30 truncate">
                  {track.artists.map((a) => a.name).join(', ')}
                </p>
              </div>
              <span className="text-xs text-white/20 tabular-nums shrink-0">
                {formatDuration(track.duration_ms)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
