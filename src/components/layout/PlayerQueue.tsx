import { useTranslation } from 'react-i18next'
import { usePlayer } from '@/contexts/PlayerContext'
import { TrackRow } from '@/components/shared/TrackRow'

export function PlayerQueue() {
  const { t } = useTranslation()
  const { state, controls } = usePlayer()
  const upcoming = state.queue.slice(state.queueIndex + 1)

  if (upcoming.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <p className="text-white/30 text-sm">{t('player.emptyQueue', 'A fila está vazia')}</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4 pb-40">
      <div className="max-w-3xl mx-auto">
        <h3 className="text-[10px] text-white/25 uppercase tracking-[0.2em] font-bold mb-4 text-center">
          {t('player.nextUp')}
        </h3>
        <div className="space-y-0.5">
          {upcoming.map((track, i) => (
            <TrackRow
              key={state.queueIndex + 1 + i}
              track={track}
              theme="dark"
              onPlay={async (t) => controls.playTrack(t, state.queue)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
