import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePlayer } from '@/hooks/usePlayer'
import { useLyrics } from '@/hooks/queries/useLyrics'
import { LyricsView } from '@/components/layout/LyricsView'
import { TrackInfoPanel } from '@/components/layout/TrackInfoPanel'
import { PlayerSync } from '@/components/layout/PlayerSync'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'

export function PlayerView() {
  const { state, dispatch } = usePlayer()
  const { currentTrack, progress, duration } = state
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [showInfo, setShowInfo] = useState(false)

  const artistName = currentTrack?.artists[0]?.name ?? ''
  const trackName = currentTrack?.name ?? ''
  const albumName = currentTrack?.album.name
  const lyrics = useLyrics({ artist: artistName, title: trackName, album: albumName, durationMs: duration })
  const albumArt = currentTrack?.album.images[0]?.url

  const handleSeek = useCallback(async (ms: number) => {
    dispatch({ type: 'SET_PROGRESS', payload: ms })
    try { await api.put('/me/player/seek', null, { params: { position_ms: ms }, responseType: 'text' }) } catch { /* silent */ }
  }, [dispatch])

  const noLyrics = !lyrics.isPending && (!lyrics.data || lyrics.data.length === 0)
  const isShowingInfo = showInfo || noLyrics

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* Background blur */}
      {albumArt && (
        <div
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{
            backgroundImage: `url(${albumArt})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(80px)',
            transform: 'scale(1.2)',
          }}
        />
      )}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      {/* Header — fixo sobre o conteúdo */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl glass"
          aria-label={t('player.back')}
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <p className="text-xs text-white/40 uppercase tracking-widest">
          {t('lyrics.nowPlaying')}
        </p>
        {!noLyrics ? (
          <button
            onClick={() => setShowInfo(v => !v)}
            className={cn('p-2 rounded-xl glass', showInfo && 'bg-white/20')}
            aria-label={t('player.trackInfo')}
          >
            <FileText size={18} className="text-white" />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Conteúdo principal — absolute inset-0 garante dimensões concretas para overflow-y-auto */}
      <AnimatePresence mode="wait">
        {isShowingInfo ? (
          <motion.div
            key="info"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 overflow-y-auto pt-20 pb-36"
          >
            {currentTrack && <TrackInfoPanel track={currentTrack} />}
          </motion.div>
        ) : lyrics.isPending ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <p className="text-white/30 text-sm">{t('lyrics.searching')}</p>
          </motion.div>
        ) : (
          <motion.div
            key="lyrics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pt-20 pb-32"
          >
            <LyricsView
              lines={lyrics.data ?? []}
              progress={progress}
              duration={duration}
              onSeek={handleSeek}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <PlayerSync />
    </div>
  )
}
