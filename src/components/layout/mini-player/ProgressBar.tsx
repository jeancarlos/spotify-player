import { useTranslation } from 'react-i18next'
import { usePlayer, useProgress } from '@/contexts/PlayerContext'
import { formatDuration } from '@/utils/formatDuration'

export function ProgressBar() {
  const { controls } = usePlayer()
  const { progressMs: progress, durationMs: duration } = useProgress()
  const { t } = useTranslation()
  const percentage = duration ? Math.round((progress / duration) * 100) : 0
  const background = `linear-gradient(to right, rgb(var(--color-primary)) ${percentage}%, #d4d4d8 ${percentage}%) center / 100% var(--track-h, 1px) no-repeat`

  return (
    <div className="flex flex-col items-center gap-1 absolute top-[-8px] left-0 right-0 w-full z-10 px-8 pointer-events-none">
      <input
        type="range"
        min={0}
        max={duration || 1}
        value={progress}
        onChange={(e) => {
          controls.seek(Number(e.target.value))
        }}
        aria-label={t('player.seek')}
        aria-valuetext={t('player.progressText', {
          current: formatDuration(progress),
          total: formatDuration(duration),
        })}
        className="w-full h-4 group-hover/miniplayer:[--track-h:2px] appearance-none cursor-pointer pointer-events-auto transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:scale-0 [&::-webkit-slider-thumb]:transition-transform group-hover/miniplayer:[&::-webkit-slider-thumb]:scale-100 active:[&::-webkit-slider-thumb]:scale-100 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:scale-0 [&::-moz-range-thumb]:transition-transform group-hover/miniplayer:[&::-moz-range-thumb]:scale-100 active:[&::-moz-range-thumb]:scale-100"
        style={{ background }}
      />
    </div>
  )
}
