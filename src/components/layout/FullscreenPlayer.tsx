import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Volume2,
  Shuffle,
  Repeat,
  Repeat1,
  Music,
  ListMusic,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePlayer } from '@/hooks/usePlayer'
import { useLyrics } from '@/hooks/queries/useLyrics'
import { formatDuration } from '@/utils/formatDuration'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'

export function FullscreenPlayer() {
  const { state, dispatch } = usePlayer()
  const { t } = useTranslation()
  const { currentTrack, isPlaying, progress, duration, volume, shuffle, repeat, isFullscreen, palette, queue } = state
  const [showLyrics, setShowLyrics] = useState(false)
  const [showQueue, setShowQueue] = useState(false)

  const artistName = currentTrack?.artists[0]?.name ?? ''
  const trackName = currentTrack?.name ?? ''
  const lyrics = useLyrics(artistName, trackName, isFullscreen && showLyrics)

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

  const handleQueuePlay = useCallback(
    (index: number) => {
      const track = queue[index]
      if (!track) return
      dispatch({ type: 'SET_TRACK', payload: track })
      dispatch({ type: 'SET_PLAYING', payload: true })
      // Remove tracks before selected index from queue
      dispatch({ type: 'SET_QUEUE', payload: queue.slice(index + 1) })
    },
    [dispatch, queue]
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

          <div className="relative flex flex-col w-full p-8 gap-8 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => dispatch({ type: 'TOGGLE_FULLSCREEN' })}
                className="glass-button p-2 rounded-xl"
              >
                <X size={18} />
              </button>
              <p className="text-xs text-white/40 uppercase tracking-widest">{t('lyrics.nowPlaying')}</p>
              <div className="flex items-center gap-2">
                {/* Queue toggle */}
                <button
                  id="queue-toggle"
                  onClick={() => { setShowQueue(q => !q); setShowLyrics(false) }}
                  className={cn('glass-button p-2 rounded-xl transition-colors', showQueue && 'bg-white/20')}
                  title={t('player.queue')}
                >
                  <ListMusic size={18} />
                </button>
                {/* Lyrics toggle */}
                <button
                  id="lyrics-toggle"
                  onClick={() => { setShowLyrics(l => !l); setShowQueue(false) }}
                  className={cn('glass-button p-2 rounded-xl transition-colors', showLyrics && 'bg-white/20')}
                >
                  <Music size={18} />
                </button>
              </div>
            </div>

            {/* Main content */}
            <div className="flex flex-1 gap-8 items-center overflow-hidden">
              {/* Album art + track info */}
              <div className="flex flex-col items-center gap-6 flex-1 min-w-0">
                {currentTrack?.album.images[0]?.url && (
                  <motion.img
                    key={currentTrack.id}
                    src={currentTrack.album.images[0].url}
                    alt={currentTrack.album.name}
                    className="w-64 h-64 rounded-2xl object-cover shrink-0"
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

              {/* Lyrics panel */}
              <AnimatePresence>
                {showLyrics && (
                  <motion.div
                    key="lyrics"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="flex-1 h-full overflow-y-auto glass-card p-6"
                  >
                    {lyrics.isPending ? (
                      <p className="text-white/30 text-sm">{t('lyrics.searching')}</p>
                    ) : lyrics.data ? (
                      <pre className="font-sans text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                        {lyrics.data}
                      </pre>
                    ) : (
                      <div className="text-center space-y-2 py-8">
                        <p className="text-white/30 text-sm">{t('lyrics.notFound')}</p>
                        {currentTrack && (
                          <div className="glass-card-md p-4 text-left space-y-1 mt-4">
                            <p className="text-xs text-white/50">{t('lyrics.album')}: {currentTrack.album.name}</p>
                            <p className="text-xs text-white/50">
                              {t('lyrics.releaseDate')}: {currentTrack.album.release_date}
                            </p>
                            <p className="text-xs text-white/50">{t('lyrics.popularity')}: {currentTrack.popularity}</p>
                            <p className="text-xs text-white/50">
                              {t('lyrics.duration')}: {formatDuration(currentTrack.duration_ms)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Queue panel */}
              <AnimatePresence>
                {showQueue && (
                  <motion.div
                    key="queue"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="flex-1 h-full overflow-hidden glass-card flex flex-col"
                  >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                      <p className="text-sm font-bold">{t('player.queue')}</p>
                      <button
                        onClick={() => setShowQueue(false)}
                        className="glass-button p-1.5 rounded-lg"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                      {queue.length === 0 ? (
                        <p className="text-white/30 text-sm text-center py-8">{t('player.noTrack')}</p>
                      ) : (
                        queue.map((track, i) => (
                          <button
                            key={`${track.id}-${i}`}
                            onClick={() => handleQueuePlay(i)}
                            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-left group"
                          >
                            <span className="text-xs text-white/30 w-5 shrink-0">{i + 1}</span>
                            <img
                              src={track.album.images[0]?.url}
                              alt={track.album.name}
                              className="w-9 h-9 rounded-lg object-cover shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-white truncate group-hover:text-white/90">
                                {track.name}
                              </p>
                              <p className="text-xs text-white/40 truncate">
                                {track.artists.map(a => a.name).join(', ')}
                              </p>
                            </div>
                            <span className="text-xs text-white/30 shrink-0">
                              {formatDuration(track.duration_ms)}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Controls */}
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
