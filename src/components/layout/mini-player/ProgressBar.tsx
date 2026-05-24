import { useTranslation } from 'react-i18next'
import { formatDuration } from '@/utils/formatDuration'

interface ProgressBarProps {
  progress: number
  duration: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function ProgressBar({ progress, duration, onChange }: ProgressBarProps) {
  const { t } = useTranslation()
  const percentage = duration ? Math.round((progress / duration) * 100) : 0
  const background = `linear-gradient(to right, #1DB954 ${percentage}%, #d4d4d8 ${percentage}%)`

  return (
    <div className="flex flex-col items-center gap-1 absolute top-[-1px] left-0 right-0 w-full z-10 px-8 pointer-events-none">
      <input
        type="range"
        min={0}
        max={duration || 1}
        value={progress}
        onChange={onChange}
        aria-label={t('player.seek')}
        aria-valuetext={`${formatDuration(progress)} de ${formatDuration(duration)}`}
        className="w-full h-[1px] group-hover/miniplayer:h-[2px] group-hover/miniplayer:rounded-b-full appearance-none cursor-pointer pointer-events-auto transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1DB954] [&::-webkit-slider-thumb]:scale-0 [&::-webkit-slider-thumb]:transition-transform group-hover/miniplayer:[&::-webkit-slider-thumb]:scale-100 active:[&::-webkit-slider-thumb]:scale-100 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#1DB954] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:scale-0 [&::-moz-range-thumb]:transition-transform group-hover/miniplayer:[&::-moz-range-thumb]:scale-100 active:[&::-moz-range-thumb]:scale-100"
        style={{ background }}
      />
    </div>
  )
}
