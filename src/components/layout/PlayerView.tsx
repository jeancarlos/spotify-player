import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, SkipBack, Play, Pause, SkipForward, ListMusic, Music, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePlayer } from '@/hooks/usePlayer'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { useLyrics } from '@/hooks/queries/useLyrics'
import { useToast } from '@/components/ui/toast'
import { formatDuration } from '@/utils/formatDuration'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'
import type { AxiosError } from 'axios'

export function PlayerView() {
  const { state, dispatch } = usePlayer()
  const { currentTrack, isPlaying, progress, duration, queue } = state
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { toast } = useToast()
  const playTrack = usePlayTrack()
  const [panel, setPanel] = useState<'lyrics' | 'queue' | null>(null)

  const artistName = currentTrack?.artists[0]?.name ?? ''
  const trackName = currentTrack?.name ?? ''
  const lyrics = useLyrics(artistName, trackName)

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

  const handleQueuePlay = useCallback((index: number) => {
    const track = queue[index]
    if (track) playTrack(track, queue.slice(index + 1))
  }, [playTrack, queue])

  const albumArt = currentTrack?.album.images[0]?.url

  return (
    <div className="relative min-h-screen bg-black overflow-hidden flex flex-col">
      {/* Background blur */}
      {albumArt && (
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url(${albumArt})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(60px)',
            transform: 'scale(1.1)',
          }}
        />
      )}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative flex flex-col flex-1 p-6 gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl glass"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <p className="text-xs text-white/40 uppercase tracking-widest">{t('lyrics.nowPlaying')}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPanel(p => p === 'queue' ? null : 'queue')}
              className={cn('p-2 rounded-xl glass', panel === 'queue' && 'bg-white/20')}
            >
              <ListMusic size={18} className="text-white" />
            </button>
            <button
              onClick={() => setPanel(p => p === 'lyrics' ? null : 'lyrics')}
              className={cn('p-2 rounded-xl glass', panel === 'lyrics' && 'bg-white/20')}
            >
              <Music size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* Main */}
        <div className="flex flex-1 gap-6 overflow-hidden">
          {/* Album art + info */}
          <div className="flex flex-col items-center justify-center gap-6 flex-1">
            {albumArt && (
              <motion.img
                key={currentTrack?.id}
                src={albumArt}
                alt={currentTrack?.album.name}
                className="w-64 h-64 rounded-2xl object-cover shadow-2xl"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              />
            )}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">{currentTrack?.name}</h2>
              <p className="text-white/60 mt-1">
                {currentTrack?.artists.map(a => a.name).join(', ')}
              </p>
            </div>
          </div>

          {/* Side panel */}
          <AnimatePresence mode="wait">
            {panel && (
              <motion.div
                key={panel}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.2 }}
                className="w-80 glass-card flex flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                  <p className="text-sm font-bold text-white">
                    {panel === 'lyrics' ? t('player.lyrics') : t('player.queue')}
                  </p>
                  <button onClick={() => setPanel(null)}>
                    <X size={16} className="text-white/50" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-3">
                  {panel === 'lyrics' && (
                    lyrics.isPending ? (
                      <p className="text-white/30 text-sm p-4">{t('lyrics.searching')}</p>
                    ) : lyrics.data && lyrics.data.length > 0 ? (
                      <pre className="font-sans text-sm text-white/80 leading-relaxed whitespace-pre-wrap p-2">
                        {lyrics.data.join('\n')}
                      </pre>
                    ) : (
                      <p className="text-white/30 text-sm p-4">{t('lyrics.notFound')}</p>
                    )
                  )}

                  {panel === 'queue' && (
                    queue.length === 0 ? (
                      <p className="text-white/30 text-sm p-4">{t('player.noTrack')}</p>
                    ) : (
                      <div className="space-y-1">
                        {queue.map((track, i) => (
                          <button
                            key={`${track.id}-${i}`}
                            onClick={() => handleQueuePlay(i)}
                            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-left"
                          >
                            <span className="text-xs text-white/30 w-4 shrink-0">{i + 1}</span>
                            <img
                              src={track.album.images[0]?.url}
                              className="w-9 h-9 rounded-lg object-cover shrink-0"
                              alt={track.album.name}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-white truncate">{track.name}</p>
                              <p className="text-xs text-white/40 truncate">
                                {track.artists.map(a => a.name).join(', ')}
                              </p>
                            </div>
                            <span className="text-xs text-white/30 shrink-0">
                              {formatDuration(track.duration_ms)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 w-full max-w-md">
            <span className="text-xs text-white/40 w-10 text-right">{formatDuration(progress)}</span>
            <input
              type="range" min={0} max={duration || 1} value={progress}
              onChange={handleSeek}
              className="flex-1 h-1.5 appearance-none bg-white/20 rounded-full accent-white cursor-pointer"
            />
            <span className="text-xs text-white/40 w-10">{formatDuration(duration)}</span>
          </div>
          <div className="flex items-center gap-6">
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
          </div>
        </div>
      </div>
    </div>
  )
}
