import { useCallback } from 'react'
import { SkipBack, Play, Pause, SkipForward, Volume2, Maximize2, Shuffle, Repeat, Repeat1 } from 'lucide-react'
import { usePlayer } from '@/hooks/usePlayer'
import { useTranslation } from 'react-i18next'
import { formatDuration } from '@/utils/formatDuration'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'

export function MiniPlayer() {
  const { state, dispatch } = usePlayer()
  const { t } = useTranslation()
  const { currentTrack, isPlaying, progress, duration, volume, shuffle, repeat } = state

  const handlePlayPause = useCallback(async () => {
    dispatch({ type: 'TOGGLE_PLAY' })
    try {
      await api.put(isPlaying ? '/me/player/pause' : '/me/player/play')
    } catch {
      // silently fail — user may not have an active device
    }
  }, [dispatch, isPlaying])

  const handlePrev = useCallback(async () => {
    try {
      await api.post('/me/player/previous')
    } catch { /* silent */ }
  }, [])

  const handleNext = useCallback(async () => {
    dispatch({ type: 'SET_PROGRESS', payload: 0 })
    try {
      await api.post('/me/player/next')
    } catch { /* silent */ }
  }, [dispatch])

  const handleSeek = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const ms = Number(e.target.value)
      dispatch({ type: 'SET_PROGRESS', payload: ms })
      try {
        await api.put('/me/player/seek', null, { params: { position_ms: ms } })
      } catch { /* silent */ }
    },
    [dispatch]
  )

  const handleVolume = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value)
      dispatch({ type: 'SET_VOLUME', payload: value })
      try {
        await api.put('/me/player/volume', null, {
          params: { volume_percent: Math.round(value * 100) },
        })
      } catch { /* silent */ }
    },
    [dispatch]
  )

  const toggleShuffle = useCallback(async () => {
    dispatch({ type: 'TOGGLE_SHUFFLE' })
    try {
      await api.put('/me/player/shuffle', null, { params: { state: !shuffle } })
    } catch { /* silent */ }
  }, [dispatch, shuffle])

  const cycleRepeat = useCallback(async () => {
    const next = repeat === 'off' ? 'context' : repeat === 'context' ? 'track' : 'off'
    dispatch({ type: 'SET_REPEAT', payload: next })
    try {
      await api.put('/me/player/repeat', null, { params: { state: next } })
    } catch { /* silent */ }
  }, [dispatch, repeat])

  return (
    <div className="glass-card-md shrink-0 border-t border-white/5 px-4 py-3 flex items-center gap-4">
      {/* Track info */}
      <div className="flex items-center gap-3 w-56 shrink-0">
        {currentTrack ? (
          <>
            <img
              src={currentTrack.album.images[0]?.url}
              alt={currentTrack.album.name}
              className="w-11 h-11 rounded-lg object-cover shrink-0"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">{currentTrack.name}</p>
              <p className="text-xs text-white/50 truncate">
                {currentTrack.artists.map(a => a.name).join(', ')}
              </p>
            </div>
          </>
        ) : (
          <p className="text-xs text-white/30">{t('player.nowPlaying')}</p>
        )}
      </div>

      {/* Controls + progress */}
      <div className="flex flex-col items-center gap-1.5 flex-1">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            className={cn('transition-colors', shuffle ? 'text-primary' : 'text-white/40 hover:text-white')}
          >
            <Shuffle size={14} />
          </button>
          <button onClick={handlePrev} className="text-white/70 hover:text-white transition-colors">
            <SkipBack size={18} className="fill-current" />
          </button>
          <button
            onClick={handlePlayPause}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying
              ? <Pause size={14} className="fill-black text-black" />
              : <Play size={14} className="fill-black text-black ml-0.5" />}
          </button>
          <button onClick={handleNext} className="text-white/70 hover:text-white transition-colors">
            <SkipForward size={18} className="fill-current" />
          </button>
          <button
            onClick={cycleRepeat}
            className={cn('transition-colors', repeat !== 'off' ? 'text-primary' : 'text-white/40 hover:text-white')}
          >
            {repeat === 'track' ? <Repeat1 size={14} /> : <Repeat size={14} />}
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 w-full max-w-sm">
          <span className="text-xs text-white/30 w-8 text-right">{formatDuration(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={progress}
            onChange={handleSeek}
            className="flex-1 h-1 appearance-none bg-white/20 rounded-full accent-white cursor-pointer"
          />
          <span className="text-xs text-white/30 w-8">{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Volume + expand */}
      <div className="flex items-center gap-3 w-40 justify-end shrink-0">
        <Volume2 size={14} className="text-white/40 shrink-0" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={handleVolume}
          className="w-20 h-1 appearance-none bg-white/20 rounded-full accent-white cursor-pointer"
        />
        <button
          onClick={() => dispatch({ type: 'TOGGLE_FULLSCREEN' })}
          className="text-white/40 hover:text-white transition-colors"
        >
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  )
}
