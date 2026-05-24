// src/components/layout/MiniPlayer.tsx
import { useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  ListMusic,
  Heart,
} from 'lucide-react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { usePlayer } from '@/hooks/usePlayer'
import { useProgressEngine } from '@/hooks/useProgressEngine'
import { useToast } from '@/components/ui/toast'
import { useTranslation } from 'react-i18next'
import { VinylDisk } from '@/components/vinyl/VinylDisk'
import { formatDuration } from '@/utils/formatDuration'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'
import type { AxiosError } from 'axios'
import { useSpoterPlaylist } from '@/hooks/useSpoterPlaylist'

function Tip({ label }: { label: string }) {
  return (
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 text-[10px] bg-black/80 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
      {label}
    </span>
  )
}

interface ProgressBarProps {
  progress: number
  duration: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function ProgressBar({ progress, duration, onChange }: ProgressBarProps) {
  const { t } = useTranslation()
  const percentage = duration ? Math.round((progress / duration) * 100) : 0
  const background = `linear-gradient(to right, #1DB954 ${percentage}%, #d4d4d8 ${percentage}%)`

  return (
    <div className="group/progress flex flex-col items-center gap-1 absolute top-[-1px] left-0 right-0 w-full z-10 px-8">
      <input
        type="range"
        min={0}
        max={duration || 1}
        value={progress}
        onChange={onChange}
        aria-label={t('player.seek')}
        aria-valuetext={`${formatDuration(progress)} de ${formatDuration(duration)}`}
        className="w-full h-[1px] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1DB954] [&::-webkit-slider-thumb]:scale-0 [&::-webkit-slider-thumb]:transition-transform group-hover/progress:[&::-webkit-slider-thumb]:scale-100 active:[&::-webkit-slider-thumb]:scale-100 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#1DB954] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:scale-0 [&::-moz-range-thumb]:transition-transform group-hover/progress:[&::-moz-range-thumb]:scale-100 active:[&::-moz-range-thumb]:scale-100"
        style={{ background }}
      />
    </div>
  )
}

interface MiniPlayerProps {
  onHoverChange?: (hovered: boolean) => void
}

export function MiniPlayer({ onHoverChange }: MiniPlayerProps) {
  const { state, dispatch } = usePlayer()
  const { currentTrack, isPlaying, shuffle, repeat } = state
  const { currentProgress, seekTo: engineSeekTo } = useProgressEngine()

  const duration = currentTrack?.duration_ms || 0
  const progress = currentProgress

  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const { t } = useTranslation()

  const isPlayerPage = location.pathname === '/player'
  const activeTab = (searchParams.get('tab') as 'lyrics' | 'info') || 'lyrics'

  const goBack = () => {
    const from = location.state?.from ?? '/'
    navigate(from)
  }

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      action()
    }
  }

  const handlePlayPause = useCallback(async () => {
    const next = !isPlaying
    dispatch({ type: 'SET_PLAYING', payload: next })
    try {
      await api.put(next ? '/me/player/play' : '/me/player/pause')
    } catch (err) {
      dispatch({ type: 'SET_PLAYING', payload: isPlaying })
      const status = (err as AxiosError).response?.status
      if (status === 404 || status === 403) toast(t('player.noActiveDevice'), 'info')
    }
  }, [dispatch, isPlaying, toast, t])

  const handleSeek = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const ms = Number(e.target.value)
      engineSeekTo(ms)
      dispatch({ type: 'SET_SEEK_TIME', payload: Date.now() })
      try {
        await api.put('/me/player/seek', null, {
          params: { position_ms: ms },
          responseType: 'text',
        })
      } catch {
        /* silent */
      }
    },
    [dispatch, engineSeekTo]
  )

  const handlePrev = useCallback(async () => {
    try {
      await api.post('/me/player/previous', null, { responseType: 'text' })
    } catch {
      /* silent */
    }
  }, [])

  const handleNext = useCallback(async () => {
    engineSeekTo(0)
    try {
      await api.post('/me/player/next', null, { responseType: 'text' })
    } catch {
      /* silent */
    }
  }, [engineSeekTo])

  const toggleShuffle = useCallback(async () => {
    dispatch({ type: 'TOGGLE_SHUFFLE' })
    try {
      await api.put('/me/player/shuffle', null, {
        params: { state: !shuffle },
        responseType: 'text',
      })
    } catch {
      /* silent */
    }
  }, [dispatch, shuffle])

  const cycleRepeat = useCallback(async () => {
    const nextRepeatState: Record<string, 'off' | 'context' | 'track'> = {
      off: 'context',
      context: 'track',
      track: 'off',
    }
    const next = nextRepeatState[repeat] || 'off'

    dispatch({ type: 'SET_REPEAT', payload: next })
    try {
      await api.put('/me/player/repeat', null, { params: { state: next }, responseType: 'text' })
    } catch {
      /* silent */
    }
  }, [dispatch, repeat])

  const { tracks, addTrack, removeTrack } = useSpoterPlaylist()
  const isSaved = !!currentTrack && tracks.some((t) => t.uri === currentTrack.uri)

  const handleHeart = useCallback(() => {
    if (!currentTrack) return
    if (isSaved) {
      removeTrack(currentTrack.uri)
      toast(t('favorites.removedFromList'), 'info')
    } else {
      addTrack(currentTrack)
      toast(t('favorites.addedToList'), 'success')
    }
  }, [currentTrack, isSaved, addTrack, removeTrack, toast, t])

  return (
    <motion.aside
      initial={{ y: 300 }}
      animate={{ y: 0 }}
      exit={{ y: 300 }}
      transition={{ type: 'spring', stiffness: 240, damping: 26 }}
      className="rounded-full glass shadow-xl fixed bottom-2 left-2 right-2 z-30 max-w-[600px] mx-auto flex flex-col gap-1"
      aria-label={t('lyrics.nowPlaying', 'Tocando agora')}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      <div className="absolute inset-0 rounded-full pointer-events-none z-0" />

      {currentTrack && (
        <ProgressBar progress={progress} duration={duration} onChange={handleSeek} />
      )}

      {/* Controles */}
      <div className="relative px-4 py-3 flex items-center gap-3">
        {/* Track info + waveform */}
        <div
          className="flex items-center gap-2.5 flex-1 min-w-0 overflow-hidden cursor-pointer group/track"
          onClick={() => {
            if (isPlayerPage) goBack()
            else if (currentTrack)
              navigate('/player?tab=lyrics', { state: { from: location.pathname } })
          }}
          role="button"
          tabIndex={currentTrack ? 0 : -1}
          onKeyDown={(e) => {
            if (isPlayerPage) handleKeyDown(e, goBack)
            else if (currentTrack)
              handleKeyDown(e, () =>
                navigate('/player?tab=lyrics', { state: { from: location.pathname } })
              )
          }}
          aria-label={currentTrack ? `${t('player.viewTrack')}: ${currentTrack.name}` : undefined}
        >
          {currentTrack ? (
            <>
              <VinylDisk
                size="xs"
                albumArt={currentTrack.album.images[0]?.url}
                isPlaying={isPlaying}
                albumName={currentTrack.album.name}
              />
              <div className="min-w-0 flex-1 overflow-hidden flex flex-col justify-center">
                <span className="text-xs font-bold text-black truncate group-hover/track:underline">
                  {currentTrack.name}
                </span>
                <div className="flex gap-1 overflow-hidden">
                  {currentTrack.artists.map((a, i) => (
                    <button
                      key={a.id}
                      className="overflow-hidden truncate text-[11px] text-black/50 hover:text-black hover:underline cursor-pointer transition-colors outline-none focus:text-black focus:underline"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/artists/${a.id}`)
                      }}
                      onKeyDown={(e) => {
                        e.stopPropagation()
                        handleKeyDown(e, () => navigate(`/artists/${a.id}`))
                      }}
                    >
                      {a.name}
                      {i < currentTrack.artists.length - 1 ? ', ' : ''}
                    </button>
                  ))}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/albums/${currentTrack.album.id}`, {
                      state: { from: location.pathname },
                    })
                  }}
                  onKeyDown={(e) => {
                    e.stopPropagation()
                    handleKeyDown(e, () =>
                      navigate(`/albums/${currentTrack.album.id}`, {
                        state: { from: location.pathname },
                      })
                    )
                  }}
                  className="text-[10px] font-medium text-black/30 hover:text-black hover:underline truncate outline-none text-left w-fit"
                >
                  {currentTrack.album.name}
                </button>
              </div>

              <div className="flex flex-col gap-0.5" aria-hidden="true">
                <span className="text-[10px] font-mono shrink-0 tabular-nums">
                  {formatDuration(progress)}
                </span>
                <span className="text-[10px] font-mono shrink-0 tabular-nums">
                  {formatDuration(duration)}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 w-full cursor-default">
              <VinylDisk size="xs" albumArt={undefined} />
              <p className="text-xs text-black/70">{t('player.noTrack')}</p>
            </div>
          )}
        </div>

        {/* Coração */}
        {currentTrack && (
          <div className="relative group shrink-0">
            <button
              onClick={handleHeart}
              aria-label={isSaved ? t('favorites.removeFromList') : t('favorites.addToList')}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                isSaved ? 'text-red-500 scale-110' : 'text-black/30 hover:text-red-400'
              )}
            >
              <Heart size={16} className={isSaved ? 'fill-current' : ''} />
            </button>
            <Tip label={isSaved ? t('favorites.removedFromList') : t('favorites.addToList')} />
          </div>
        )}

        {/* Controles */}
        {currentTrack && (
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Shuffle */}
            <div className="relative group hidden sm:block">
              <button
                onClick={toggleShuffle}
                aria-label={t('player.shuffle')}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  shuffle ? 'text-black' : 'text-black/30 hover:text-black/60'
                )}
              >
                <Shuffle size={15} />
              </button>
              <Tip label={t('player.shuffle')} />
            </div>

            {/* Anterior */}
            <div className="relative group hidden min-[400px]:block">
              <button
                onClick={handlePrev}
                aria-label={t('player.previous')}
                className="p-1.5 rounded-lg text-black/60 hover:text-black transition-colors"
              >
                <SkipBack size={18} className="fill-current" />
              </button>
              <Tip label={t('player.previous')} />
            </div>

            {/* Play / Pause */}
            <div className="relative group/play">
              <button
                onClick={handlePlayPause}
                aria-label={isPlaying ? t('player.pause') : t('player.play')}
                className="w-9 h-9 rounded-full bg-black flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                {isPlaying ? (
                  <Pause size={14} className="fill-white text-white" />
                ) : (
                  <Play size={14} className="fill-white text-white ml-0.5" />
                )}
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 text-center text-[11px] text-white bg-black/85 rounded-lg px-3 py-2 opacity-0 group-hover/play:opacity-100 transition-opacity pointer-events-none whitespace-normal leading-snug z-50">
                {t('login.hint')}
              </div>
            </div>

            {/* Próximo */}
            <div className="relative group hidden min-[400px]:block">
              <button
                onClick={handleNext}
                aria-label={t('player.next')}
                className="p-1.5 rounded-lg text-black/60 hover:text-black transition-colors"
              >
                <SkipForward size={18} className="fill-current" />
              </button>
              <Tip label={t('player.next')} />
            </div>

            {/* Repetir */}
            <div className="relative group hidden sm:block">
              <button
                onClick={cycleRepeat}
                aria-label={t('player.repeat')}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  repeat !== 'off' ? 'text-black' : 'text-black/30 hover:text-black/60'
                )}
              >
                {repeat === 'track' ? <Repeat1 size={15} /> : <Repeat size={15} />}
              </button>
              <Tip label={t('player.repeat')} />
            </div>

            {/* Detalhes */}
            <div className="relative group hidden sm:block">
              <button
                onClick={() => {
                  if (!isPlayerPage) {
                    navigate('/player?tab=lyrics', { state: { from: location.pathname } })
                  } else if (activeTab === 'lyrics') {
                    navigate('/player?tab=info', { replace: true })
                  } else {
                    goBack()
                  }
                }}
                aria-label={
                  isPlayerPage && activeTab === 'info' ? t('player.closeQueue') : t('player.queue')
                }
                className="p-1.5 rounded-lg transition-colors outline-none text-black/30 hover:text-black"
              >
                <ListMusic size={15} />
              </button>
              <Tip
                label={
                  isPlayerPage && activeTab === 'info' ? t('player.closeQueue') : t('player.queue')
                }
              />
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  )
}
