// src/components/layout/MiniPlayer.tsx
import { useCallback } from 'react'
import {
  SkipBack, Play, Pause, SkipForward,
  Shuffle, Repeat, Repeat1, ListMusic, Home,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePlayer } from '@/hooks/usePlayer'
import { useToast } from '@/components/ui/toast'
import { useTranslation } from 'react-i18next'
import { WaveformBars } from '@/components/shared/WaveformBars'
import { VinylDisk } from '@/components/vinyl/VinylDisk'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/utils/formatDuration'
import api from '@/lib/axios'
import type { AxiosError } from 'axios'

function Tip({ label }: { label: string }) {
  return (
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 text-[10px] bg-black/80 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
      {label}
    </span>
  )
}

export function MiniPlayer() {
  const { state, dispatch } = usePlayer()
  const { currentTrack, isPlaying, shuffle, repeat, progress, duration } = state
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { t } = useTranslation()

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

  const handlePrev = useCallback(async () => {
    try { await api.post('/me/player/previous') } catch { /* silent */ }
  }, [])

  const handleNext = useCallback(async () => {
    dispatch({ type: 'SET_PROGRESS', payload: 0 })
    try { await api.post('/me/player/next') } catch { /* silent */ }
  }, [dispatch])

  const handleSeek = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const ms = Number(e.target.value)
    dispatch({ type: 'SET_PROGRESS', payload: ms })
    try { await api.put('/me/player/seek', null, { params: { position_ms: ms } }) } catch { /* silent */ }
  }, [dispatch])

  const toggleShuffle = useCallback(async () => {
    dispatch({ type: 'TOGGLE_SHUFFLE' })
    try { await api.put('/me/player/shuffle', null, { params: { state: !shuffle } }) } catch { /* silent */ }
  }, [dispatch, shuffle])

  const cycleRepeat = useCallback(async () => {
    const next = repeat === 'off' ? 'context' : repeat === 'context' ? 'track' : 'off'
    dispatch({ type: 'SET_REPEAT', payload: next })
    try { await api.put('/me/player/repeat', null, { params: { state: next } }) } catch { /* silent */ }
  }, [dispatch, repeat])

  const isPlayerPage = location.pathname === '/player'

  return (
    <div className="fixed bottom-2 left-2 right-2 z-30 max-w-[600px] mx-auto flex flex-col gap-0.5">
      {/* Seek bar — mostrada quando há faixa tocando */}
      {currentTrack && (
        <div className="px-3 flex items-center gap-2">
          <span className="text-[9px] text-black/30 w-7 text-right font-mono shrink-0">
            {formatDuration(progress)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={progress}
            onChange={handleSeek}
            aria-label={t('player.seek', 'Seek')}
            className="flex-1 h-1 appearance-none bg-black/10 rounded-full accent-black cursor-pointer"
          />
          <span className="text-[9px] text-black/30 w-7 font-mono shrink-0">
            {formatDuration(duration)}
          </span>
        </div>
      )}

      {/* Pill principal */}
      <div className="rounded-full glass border-t border-white/40 px-4 py-3 flex items-center gap-3">
        {/* Home — oculto na própria página do player */}
        {!isPlayerPage && (
          <div className="relative group shrink-0">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl hover:bg-black/5 transition-colors"
              aria-label={t('nav.home')}
            >
              <Home size={18} className="text-black/40" />
            </button>
            <Tip label={t('nav.home')} />
          </div>
        )}

        {/* Track info + waveform */}
        <div
          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer group/track"
          onClick={() => currentTrack && navigate('/player')}
        >
          {currentTrack ? (
            <>
              <VinylDisk
                size="xs"
                albumArt={currentTrack.album.images[0]?.url}
                isPlaying={isPlaying}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-black truncate group-hover/track:underline">
                  {currentTrack.name}
                </p>
                <p className="text-[11px] text-black/50 truncate">
                  {currentTrack.artists.map(a => a.name).join(', ')}
                </p>
              </div>
              <WaveformBars isPlaying={isPlaying} />
            </>
          ) : (
            <p className="text-xs text-black/30">{t('player.noTrack')}</p>
          )}
        </div>

        {/* Controles */}
        {currentTrack && (
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Shuffle — oculto em telas pequenas */}
            <div className="relative group hidden sm:block">
              <button
                onClick={toggleShuffle}
                aria-label={t('player.shuffle')}
                className={cn('p-1.5 rounded-lg transition-colors', shuffle ? 'text-black' : 'text-black/30 hover:text-black/60')}
              >
                <Shuffle size={15} />
              </button>
              <Tip label={t('player.shuffle')} />
            </div>

            {/* Anterior */}
            <div className="relative group">
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
                {isPlaying
                  ? <Pause size={14} className="fill-white text-white" />
                  : <Play size={14} className="fill-white text-white ml-0.5" />}
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 text-center text-[11px] text-white bg-black/85 rounded-lg px-3 py-2 opacity-0 group-hover/play:opacity-100 transition-opacity pointer-events-none whitespace-normal leading-snug z-50">
                {t('login.hint')}
              </div>
            </div>

            {/* Próximo */}
            <div className="relative group">
              <button
                onClick={handleNext}
                aria-label={t('player.next')}
                className="p-1.5 rounded-lg text-black/60 hover:text-black transition-colors"
              >
                <SkipForward size={18} className="fill-current" />
              </button>
              <Tip label={t('player.next')} />
            </div>

            {/* Repetir — oculto em telas pequenas */}
            <div className="relative group hidden sm:block">
              <button
                onClick={cycleRepeat}
                aria-label={t('player.repeat')}
                className={cn('p-1.5 rounded-lg transition-colors', repeat !== 'off' ? 'text-black' : 'text-black/30 hover:text-black/60')}
              >
                {repeat === 'track' ? <Repeat1 size={15} /> : <Repeat size={15} />}
              </button>
              <Tip label={t('player.repeat')} />
            </div>

            {/* Fila — oculto em telas pequenas e na página do player */}
            {!isPlayerPage && (
              <div className="relative group hidden sm:block">
                <button
                  onClick={() => navigate('/player')}
                  aria-label={t('player.queue')}
                  className="p-1.5 rounded-lg text-black/30 hover:text-black transition-colors"
                >
                  <ListMusic size={15} />
                </button>
                <Tip label={t('player.queue')} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
