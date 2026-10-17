import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useVirtualizer } from '@tanstack/react-virtual'
import { usePlayer } from '@/contexts/PlayerContext'
import { TrackRow } from '@/components/shared/TrackRow'

const ROW_ESTIMATE_PX = 62

export function PlayerQueue() {
  const { t } = useTranslation()
  const { state, controls } = usePlayer()
  const scrollRef = useRef<HTMLDivElement>(null)
  const start = state.queueIndex + 1
  const upcoming = state.queue.slice(start)
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: upcoming.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_ESTIMATE_PX,
    overscan: 8,
  })

  if (upcoming.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <p className="text-white/60 text-sm">{t('player.emptyQueue')}</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col pt-4">
      <h3 className="text-xs text-white/60 uppercase tracking-[0.2em] font-bold mb-4 text-center">
        {t('player.nextUp')}
      </h3>
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 pb-40">
        <div className="max-w-3xl mx-auto relative" style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((row) => (
            <div
              key={start + row.index}
              data-index={row.index}
              ref={virtualizer.measureElement}
              className="absolute inset-x-0 top-0 pb-0.5"
              style={{ transform: `translateY(${row.start}px)` }}
            >
              <TrackRow
                track={upcoming[row.index]}
                theme="dark"
                onPlay={async (t) => controls.playTrack(t, state.queue, start + row.index)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
