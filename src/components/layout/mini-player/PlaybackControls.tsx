import { useCallback } from 'react'
import { SkipBack, Play, Pause, SkipForward, Shuffle, Repeat, Repeat1, ListMusic } from 'lucide-react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { usePlayer } from '@/hooks/usePlayer'
import { useProgressEngine } from '@/hooks/useProgressEngine'
import { useToast } from '@/components/ui/toast'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'
import type { AxiosError } from 'axios'

export function ControlTip({ label }: { label: string }) {
  return (
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 text-[10px] bg-black/80 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
      {label}
    </span>
  )
}

function isDeviceError(err: unknown): boolean {
  const status = (err as AxiosError).response?.status
  return status === 404 || status === 403
}

export function PlaybackControls() {
  const { state, dispatch } = usePlayer()
  const { isPlaying, shuffle, repeat, currentTrack } = state
  const { seekTo: engineSeekTo } = useProgressEngine()
  const { toast } = useToast()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const isPlayerPage = location.pathname === '/player'
  const activeTab = (searchParams.get('tab') as 'lyrics' | 'info') || 'lyrics'

  const handlePlayPause = useCallback(async () => {
    const next = !isPlaying
    dispatch({ type: 'SET_PLAYING', payload: next })
    try {
      await api.put(next ? '/me/player/play' : '/me/player/pause')
    } catch (err) {
      dispatch({ type: 'SET_PLAYING', payload: isPlaying })
      if (isDeviceError(err)) toast(t('player.noActiveDevice'), 'info')
    }
  }, [dispatch, isPlaying, toast, t])

  const handlePrev = useCallback(async () => {
    try {
      await api.post('/me/player/previous', null, { responseType: 'text' })
    } catch (err) {
      if (isDeviceError(err)) toast(t('player.noActiveDevice'), 'info')
    }
  }, [toast, t])

  const handleNext = useCallback(async () => {
    engineSeekTo(0)
    try {
      await api.post('/me/player/next', null, { responseType: 'text' })
    } catch (err) {
      if (isDeviceError(err)) toast(t('player.noActiveDevice'), 'info')
    }
  }, [engineSeekTo, toast, t])

  const toggleShuffle = useCallback(async () => {
    const next = !shuffle
    dispatch({ type: 'SET_SHUFFLE', payload: next })
    try {
      await api.put('/me/player/shuffle', null, { params: { state: next }, responseType: 'text' })
    } catch (err) {
      dispatch({ type: 'SET_SHUFFLE', payload: shuffle })
      if (isDeviceError(err)) toast(t('player.noActiveDevice'), 'info')
    }
  }, [dispatch, shuffle, toast, t])

  const cycleRepeat = useCallback(async () => {
    const nextRepeatState: Record<string, 'off' | 'context' | 'track'> = {
      off: 'context', context: 'track', track: 'off',
    }
    const next = nextRepeatState[repeat] || 'off'
    dispatch({ type: 'SET_REPEAT', payload: next })
    try {
      await api.put('/me/player/repeat', null, { params: { state: next }, responseType: 'text' })
    } catch (err) {
      dispatch({ type: 'SET_REPEAT', payload: repeat })
      if (isDeviceError(err)) toast(t('player.noActiveDevice'), 'info')
    }
  }, [dispatch, repeat, toast, t])

  if (!currentTrack) return null

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="relative group hidden sm:block">
        <button onClick={toggleShuffle} className={cn('p-1.5 rounded-lg transition-colors', shuffle ? 'text-black' : 'text-black/30 hover:text-black/60')}>
          <Shuffle size={15} />
        </button>
        <ControlTip label={t('player.shuffle')} />
      </div>

      <div className="relative group hidden min-[400px]:block">
        <button onClick={handlePrev} className="p-1.5 rounded-lg text-black/60 hover:text-black transition-colors">
          <SkipBack size={18} className="fill-current" />
        </button>
        <ControlTip label={t('player.previous')} />
      </div>

      <div className="relative group/play">
        <button onClick={handlePlayPause} className="w-9 h-9 rounded-full bg-black flex items-center justify-center hover:bg-black/80 transition-colors">
          {isPlaying ? <Pause size={14} className="fill-white text-white" /> : <Play size={14} className="fill-white text-white ml-0.5" />}
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 text-center text-[11px] text-white bg-black/85 rounded-lg px-3 py-2 opacity-0 group-hover/play:opacity-100 transition-opacity pointer-events-none whitespace-normal leading-snug z-50">
          {t('login.hint')}
        </div>
      </div>

      <div className="relative group hidden min-[400px]:block">
        <button onClick={handleNext} className="p-1.5 rounded-lg text-black/60 hover:text-black transition-colors">
          <SkipForward size={18} className="fill-current" />
        </button>
        <ControlTip label={t('player.next')} />
      </div>

      <div className="relative group hidden sm:block">
        <button onClick={cycleRepeat} className={cn('p-1.5 rounded-lg transition-colors', repeat !== 'off' ? 'text-black' : 'text-black/30 hover:text-black/60')}>
          {repeat === 'track' ? <Repeat1 size={15} /> : <Repeat size={15} />}
        </button>
        <ControlTip label={t('player.repeat')} />
      </div>

      <div className="relative group hidden sm:block">
        <button
          onClick={() => {
            if (!isPlayerPage) navigate('/player?tab=lyrics', { state: { from: location.pathname } })
            else if (activeTab === 'lyrics') navigate('/player?tab=info', { replace: true })
            else navigate(location.state?.from ?? '/')
          }}
          className="p-1.5 rounded-lg transition-colors outline-none text-black/30 hover:text-black"
        >
          <ListMusic size={15} />
        </button>
        <ControlTip label={isPlayerPage && activeTab === 'info' ? t('player.closeQueue') : t('player.queue')} />
      </div>
    </div>
  )
}
