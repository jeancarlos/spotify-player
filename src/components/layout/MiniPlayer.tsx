import { useCallback } from 'react'
import {
  SkipBack, Play, Pause, SkipForward,
  Shuffle, Repeat, Repeat1, ListMusic, Search,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePlayer } from '@/hooks/usePlayer'
import { useToast } from '@/components/ui/toast'
import { useTranslation } from 'react-i18next'
import { WaveformBars } from '@/components/shared/WaveformBars'
import { VinylDisk } from '@/components/vinyl/VinylDisk'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'
import type { AxiosError } from 'axios'

export function MiniPlayer() {
  const { state, dispatch } = usePlayer()
  const { currentTrack, isPlaying, shuffle, repeat } = state
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { t } = useTranslation()

  // Oculto na rota /player
  if (location.pathname === '/player') return null

  const handlePlayPause = useCallback(async () => {
    const next = !isPlaying
    dispatch({ type: 'SET_PLAYING', payload: next })
    try {
      await api.put(next ? '/me/player/play' : '/me/player/pause')
    } catch (err) {
      dispatch({ type: 'SET_PLAYING', payload: isPlaying }) // revert
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

  const toggleShuffle = useCallback(async () => {
    dispatch({ type: 'TOGGLE_SHUFFLE' })
    try { await api.put('/me/player/shuffle', null, { params: { state: !shuffle } }) } catch { /* silent */ }
  }, [dispatch, shuffle])

  const cycleRepeat = useCallback(async () => {
    const next = repeat === 'off' ? 'context' : repeat === 'context' ? 'track' : 'off'
    dispatch({ type: 'SET_REPEAT', payload: next })
    try { await api.put('/me/player/repeat', null, { params: { state: next } }) } catch { /* silent */ }
  }, [dispatch, repeat])

  return (
    <div className="fixed max-w-[800px] mx-auto bottom-2 left-2 right-2 z-30 glass border-t border-white/40 px-4 py-3 flex items-center gap-3">
      {/* Busca */}
      <button
        onClick={() => navigate('/artists')}
        className="p-2 rounded-xl hover:bg-black/5 transition-colors shrink-0"
        aria-label="Buscar artistas"
      >
        <Search size={18} className="text-black/40" />
      </button>

      {/* Track info + waveform */}
      <div
        className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer group"
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
              <p className="text-xs font-bold text-black truncate group-hover:underline">
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

      {/* Controles — só visíveis com device ativo */}
      {currentTrack && <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={toggleShuffle}
          className={cn('p-1.5 rounded-lg transition-colors', shuffle ? 'text-black' : 'text-black/30 hover:text-black/60')}
        >
          <Shuffle size={15} />
        </button>
        <button onClick={handlePrev} className="p-1.5 rounded-lg text-black/60 hover:text-black transition-colors">
          <SkipBack size={18} className="fill-current" />
        </button>
        <div className="relative group/play">
          <button
            onClick={handlePlayPause}
            className="w-9 h-9 rounded-full bg-black flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            {isPlaying
              ? <Pause size={14} className="fill-white text-white" />
              : <Play size={14} className="fill-white text-white ml-0.5" />}
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 text-center text-[11px] text-white bg-black/85 rounded-lg px-3 py-2 opacity-0 group-hover/play:opacity-100 transition-opacity pointer-events-none whitespace-normal leading-snug">
            {t('login.hint')}
          </div>
        </div>
        <button onClick={handleNext} className="p-1.5 rounded-lg text-black/60 hover:text-black transition-colors">
          <SkipForward size={18} className="fill-current" />
        </button>
        <button
          onClick={cycleRepeat}
          className={cn('p-1.5 rounded-lg transition-colors', repeat !== 'off' ? 'text-black' : 'text-black/30 hover:text-black/60')}
        >
          {repeat === 'track' ? <Repeat1 size={15} /> : <Repeat size={15} />}
        </button>
        <button
          onClick={() => navigate('/player')}
          className="p-1.5 rounded-lg text-black/30 hover:text-black transition-colors"
          aria-label={t('player.queue')}
        >
          <ListMusic size={15} />
        </button>
      </div>}
    </div>
  )
}
