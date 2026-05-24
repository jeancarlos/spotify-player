import { useTranslation } from 'react-i18next'
import { usePlayer } from '@/hooks/usePlayer'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { TrackRow } from '@/components/shared/TrackRow'
import type { SpotifyTrack } from '@/types/spotify'

export function PlayerQueue() {
  const { t } = useTranslation()
  const { state } = usePlayer()
  const playTrack = usePlayTrack()
  const { queue, currentTrack } = state

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
      <div className="max-w-3xl mx-auto">
        <h3 className="text-[10px] text-white/25 uppercase tracking-[0.2em] font-bold mb-4 text-center">
          {t('player.nextUp')}
        </h3>
        <div className="space-y-0.5">
          {filteredQueue.map((track, i) => (
            <TrackRow
              key={`${track.uri}-${i}`}
              track={track}
              theme="dark"
              onPlay={(t) => playTrack(t as SpotifyTrack)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
