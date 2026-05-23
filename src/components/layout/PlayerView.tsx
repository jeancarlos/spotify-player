// src/components/layout/PlayerView.tsx
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePlayer } from '@/hooks/usePlayer'
import { useLyrics } from '@/hooks/queries/useLyrics'
import { LyricsView } from '@/components/layout/LyricsView'
import { MiniPlayer } from '@/components/layout/MiniPlayer'
import { PlayerSync } from '@/components/layout/PlayerSync'
import { formatDuration } from '@/utils/formatDuration'
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
  const lyrics = useLyrics(artistName, trackName)
  const albumArt = currentTrack?.album.images[0]?.url

  const handleSeek = useCallback(async (ms: number) => {
    dispatch({ type: 'SET_PROGRESS', payload: ms })
    try { await api.put('/me/player/seek', null, { params: { position_ms: ms } }) } catch { /* silent */ }
  }, [dispatch])

  const noLyrics = !lyrics.isPending && (!lyrics.data || lyrics.data.length === 0)
  const isShowingInfo = showInfo || noLyrics

  return (
    <div className="relative h-screen bg-black overflow-hidden flex flex-col">
      {/* Background blur */}
      {albumArt && (
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `url(${albumArt})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(80px)',
            transform: 'scale(1.2)',
          }}
        />
      )}
      <div className="absolute inset-0 bg-black/60" />

      {/* Conteúdo relativo */}
      <div className="relative flex flex-col flex-1 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
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
          {!noLyrics && (
            <button
              onClick={() => setShowInfo(v => !v)}
              className={cn('p-2 rounded-xl glass', showInfo && 'bg-white/20')}
              aria-label={t('player.trackInfo')}
            >
              <FileText size={18} className="text-white" />
            </button>
          )}
          {noLyrics && <div className="w-10" />}
        </div>

        {/* Área principal */}
        <AnimatePresence mode="wait">
          {isShowingInfo ? (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 px-8"
            >
              {albumArt && (
                <motion.img
                  key={currentTrack?.id}
                  src={albumArt}
                  alt={currentTrack?.album.name}
                  className="w-56 h-56 rounded-2xl object-cover shadow-2xl"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                />
              )}
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-white">{currentTrack?.name}</h2>
                <p className="text-white/60">
                  {currentTrack?.artists.map(a => a.name).join(', ')}
                </p>
                <p className="text-white/30 text-sm">{currentTrack?.album.name}</p>
                <p className="text-white/30 text-sm">{formatDuration(duration)}</p>
              </div>
            </motion.div>
          ) : lyrics.isPending ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <p className="text-white/30 text-sm">{t('lyrics.searching')}</p>
            </motion.div>
          ) : (
            <LyricsView
              key="lyrics"
              lines={lyrics.data ?? []}
              progress={progress}
              duration={duration}
              onSeek={handleSeek}
            />
          )}
        </AnimatePresence>
      </div>

      <PlayerSync />
      <MiniPlayer />
    </div>
  )
}
