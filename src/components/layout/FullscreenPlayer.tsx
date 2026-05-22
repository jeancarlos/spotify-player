import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, SkipBack, Play, Pause, SkipForward, Volume2, Shuffle, Repeat, Repeat1, Music } from 'lucide-react'
import { usePlayer } from '@/hooks/usePlayer'
import { useLyrics } from '@/hooks/queries/useLyrics'
import { formatDuration } from '@/utils/formatDuration'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'

export function FullscreenPlayer() {
  const { state, dispatch } = usePlayer()
  const { currentTrack, isPlaying, progress, duration, volume, shuffle, repeat, isFullscreen, palette } = state
  const [showLyrics, setShowLyrics] = useState(false)

  const artistName = currentTrack?.artists[0]?.name ?? ''
  const trackName = currentTrack?.name ?? ''
  const lyrics = useLyrics(artistName, trackName)

  const [primary, secondary] = palette ?? ['45,27,105', '22,33,62']

  const handlePlayPause = useCallback(async () => {
    dispatch({ type: 'TOGGLE_PLAY' })
    try {
      await api.put(isPlaying ? '/me/player/pause' : '/me/player/play')
    } catch { /* silent */ }
  }, [dispatch, isPlaying])

  const handlePrev = useCallback(async () => {
    try { await api.post('/me/player/previous') } catch { /* silent */ }
  }, [])

  const handleNext = useCallback(async () => {
    dispatch({ type: 'SET_PROGRESS', payload: 0 })
    try { await api.post('/me/player/next') } catch { /* silent */ }
  }, [dispatch])

  const handleSeek = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const ms = Number(e.target.value)
      dispatch({ type: 'SET_PROGRESS', payload: ms })
      try { await api.put('/me/player/seek', null, { params: { position_ms: ms } }) } catch { /* silent */ }
    },
    [dispatch]
  )

  const toggleShuffle = useCallback(async () => {
    dispatch({ type: 'TOGGLE_SHUFFLE' })
    try { await api.put('/me/player/shuffle', null, { params: { state: !shuffle } }) } catch { /* silent */ }
  }, [dispatch, shuffle])

  const cycleRepeat = useCallback(async () => {
    const next = repeat === 'off' ? 'context' : repeat === 'context' ? 'track' : 'off'
    dispatch({ type: 'SET_REPEAT', payload: next })
    try { await api.put('/me/player/repeat', null, { params: { state: next } }) } catch { /* silent */ }
  }, [dispatch, repeat])

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

  return (
    <AnimatePresence>
      {isFullscreen && (
        <motion.div
          className="fixed inset-0 z-50 flex overflow-hidden"
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          style={{
            background: `radial-gradient(ellipse at 20% 30%, rgba(${primary},0.5) 0%, transparent 55%),
                         radial-gradient(ellipse at 80% 70%, rgba(${secondary},0.4) 0%, transparent 55%),
                         rgb(8,8,12)`,
          }}
        >
          {currentTrack?.album.images[0]?.url && (
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url(${currentTrack.album.images[0].url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(60px)',
              }}
            />
          )}

          <div className="relative flex flex-col w-full p-8 gap-8">
            <div className="flex items-center justify-between">
              <button
                onClick={() => dispatch({ type: 'TOGGLE_FULLSCREEN' })}
                className="glass-button p-2 rounded-xl"
              >
                <X size={18} />
              </button>
              <p className="text-xs text-white/40 uppercase tracking-widest">Tocando agora</p>
              <button
                onClick={() => setShowLyrics(l => !l)}
                className={cn('glass-button p-2 rounded-xl transition-colors', showLyrics && 'bg-white/20')}
              >
                <Music size={18} />
              </button>
            </div>

            <div className="flex flex-1 gap-8 items-center overflow-hidden">
              <div className="flex flex-col items-center gap-6 flex-1">
                {currentTrack?.album.images[0]?.url && (
                  <motion.img
                    key={currentTrack.id}
                    src={currentTrack.album.images[0].url}
                    alt={currentTrack.album.name}
                    className="w-64 h-64 rounded-2xl object-cover"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ boxShadow: `0 0 60px rgba(${primary},0.4)` }}
                  />
                )}
                <div className="text-center">
                  <h2 className="text-2xl font-bold">{currentTrack?.name}</h2>
                  <p className="text-white/60 mt-1">
                    {currentTrack?.artists.map(a => a.name).join(', ')}
                  </p>
                  <p className="text-white/30 text-sm mt-0.5">{currentTrack?.album.name}</p>
                </div>
              </div>

              {showLyrics && (
                <div className="flex-1 h-full overflow-y-auto glass-card p-6">
                  {lyrics.isPending ? (
                    <p className="text-white/30 text-sm">Buscando letra...</p>
                  ) : lyrics.data ? (
                    <pre className="font-sans text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                      {lyrics.data}
                    </pre>
                  ) : (
                    <div className="text-center space-y-2 py-8">
                      <p className="text-white/30 text-sm">Letra não encontrada</p>
                      {currentTrack && (
                        <div className="glass-card-md p-4 text-left space-y-1 mt-4">
                          <p className="text-xs text-white/50">Álbum: {currentTrack.album.name}</p>
                          <p className="text-xs text-white/50">
                            Lançamento: {currentTrack.album.release_date}
                          </p>
                          <p className="text-xs text-white/50">Popularidade: {currentTrack.popularity}</p>
                          <p className="text-xs text-white/50">
                            Duração: {formatDuration(currentTrack.duration_ms)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3 w-full max-w-lg">
                <span className="text-xs text-white/40 w-10 text-right">{formatDuration(progress)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  value={progress}
                  onChange={handleSeek}
                  className="flex-1 h-1.5 appearance-none bg-white/20 rounded-full accent-white cursor-pointer"
                />
                <span className="text-xs text-white/40 w-10">{formatDuration(duration)}</span>
              </div>

              <div className="flex items-center gap-6">
                <button
                  onClick={toggleShuffle}
                  className={cn(shuffle ? 'text-primary' : 'text-white/40 hover:text-white', 'transition-colors')}
                >
                  <Shuffle size={18} />
                </button>
                <button onClick={handlePrev} className="text-white/70 hover:text-white transition-colors">
                  <SkipBack size={24} className="fill-current" />
                </button>
                <button
                  onClick={handlePlayPause}
                  className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
                >
                  {isPlaying
                    ? <Pause size={22} className="fill-black text-black" />
                    : <Play size={22} className="fill-black text-black ml-1" />}
                </button>
                <button onClick={handleNext} className="text-white/70 hover:text-white transition-colors">
                  <SkipForward size={24} className="fill-current" />
                </button>
                <button
                  onClick={cycleRepeat}
                  className={cn(repeat !== 'off' ? 'text-primary' : 'text-white/40 hover:text-white', 'transition-colors')}
                >
                  {repeat === 'track' ? <Repeat1 size={18} /> : <Repeat size={18} />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Volume2 size={14} className="text-white/40" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={handleVolume}
                  className="w-28 h-1 appearance-none bg-white/20 rounded-full accent-white cursor-pointer"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
