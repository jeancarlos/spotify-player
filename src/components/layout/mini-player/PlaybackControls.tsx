import {
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  ListMusic,
} from 'lucide-react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { usePlayer } from '@/contexts/PlayerContext'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { currentPath, getFromPath } from '@/utils/routerState'

export function ControlTip({ label }: { label: string }) {
  return (
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 text-[10px] bg-black/80 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
      {label}
    </span>
  )
}

export function PlaybackControls() {
  const { state, controls } = usePlayer()
  const { isPlaying, isLoading, shuffle, repeat, currentTrack } = state
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const isPlayerPage = location.pathname === '/player'
  const activeTab = (searchParams.get('tab') ?? 'lyrics') as 'lyrics' | 'info' | 'queue'

  const playLabel = isPlaying ? t('player.pause') : t('player.play')
  const queueLabel =
    isPlayerPage && activeTab === 'queue' ? t('player.closeQueue') : t('player.queue')
  const toggleQueue = () => {
    if (!isPlayerPage)
      void navigate('/player?tab=queue', { state: { from: currentPath(location) } })
    else if (activeTab !== 'queue')
      void navigate('/player?tab=queue', { replace: true, state: location.state as unknown })
    else void navigate(getFromPath(location.state))
  }

  if (!currentTrack) return null

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="relative group hidden sm:block">
        <button
          onClick={() => {
            controls.setShuffle(!shuffle)
          }}
          aria-label={t('player.shuffle')}
          aria-pressed={shuffle}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            shuffle ? 'text-black bg-black/10' : 'text-black/60 hover:text-black'
          )}
        >
          <Shuffle size={15} />
        </button>
        <ControlTip label={t('player.shuffle')} />
      </div>

      <div className="relative group hidden min-[400px]:block">
        <button
          onClick={() => {
            controls.previous()
          }}
          aria-label={t('player.previous')}
          className="p-1.5 rounded-lg text-black/60 hover:text-black transition-colors"
        >
          <SkipBack size={18} className="fill-current" />
        </button>
        <ControlTip label={t('player.previous')} />
      </div>

      <div className="relative group/play">
        <button
          onClick={() => {
            controls.toggle()
          }}
          aria-label={playLabel}
          disabled={isLoading}
          className="tap-target w-9 h-9 rounded-full bg-primary text-ink flex items-center justify-center hover:bg-primary/85 transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          {isPlaying ? (
            <Pause size={14} className="fill-current" />
          ) : (
            <Play size={14} className="fill-current ml-0.5" />
          )}
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 text-center text-[11px] text-white bg-black/85 rounded-lg px-3 py-2 opacity-0 group-hover/play:opacity-100 transition-opacity pointer-events-none whitespace-normal leading-snug z-50">
          {playLabel}
        </div>
      </div>

      <div className="relative group hidden min-[400px]:block">
        <button
          onClick={() => {
            controls.next()
          }}
          aria-label={t('player.next')}
          className="p-1.5 rounded-lg text-black/60 hover:text-black transition-colors"
        >
          <SkipForward size={18} className="fill-current" />
        </button>
        <ControlTip label={t('player.next')} />
      </div>

      <div className="relative group hidden sm:block">
        <button
          onClick={() => {
            controls.cycleRepeat()
          }}
          aria-label={t('player.repeat')}
          aria-pressed={repeat !== 'off'}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            repeat !== 'off' ? 'text-black bg-black/10' : 'text-black/60 hover:text-black'
          )}
        >
          {repeat === 'track' ? <Repeat1 size={15} /> : <Repeat size={15} />}
        </button>
        <ControlTip label={t('player.repeat')} />
      </div>

      <div className="relative group hidden sm:block">
        <button
          onClick={toggleQueue}
          aria-label={queueLabel}
          className="p-1.5 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-black/40 text-black/60 hover:text-black"
        >
          <ListMusic size={15} />
        </button>
        <ControlTip label={queueLabel} />
      </div>
    </div>
  )
}
