import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { usePlayer } from '@/hooks/usePlayer'
import { useProgressEngine } from '@/hooks/useProgressEngine'
import { useSpoterPlaylist } from '@/hooks/useSpoterPlaylist'
import { useTranslation } from 'react-i18next'
import api from '@/lib/axios'
import { ProgressBar } from './mini-player/ProgressBar'
import { TrackInfo } from './mini-player/TrackInfo'
import { PlaybackControls } from './mini-player/PlaybackControls'
import { FavoriteButton } from './mini-player/FavoriteButton'

interface MiniPlayerProps {
  onHoverChange?: (hovered: boolean) => void
}

export function MiniPlayer({ onHoverChange }: MiniPlayerProps) {
  const { state, dispatch } = usePlayer()
  const { currentTrack } = state
  const { currentProgress, seekTo: engineSeekTo } = useProgressEngine()
  const { tracks, notes, addTrack, removeTrack } = useSpoterPlaylist()
  const isSaved = !!currentTrack && tracks.some((t) => t.uri === currentTrack.uri)
  const { t } = useTranslation()

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

  return (
    <motion.aside
      initial={{ y: 300 }}
      animate={{ y: 0 }}
      exit={{ y: 300 }}
      transition={{ type: 'spring', stiffness: 240, damping: 26 }}
      className="group/miniplayer rounded-full glass shadow-xl fixed bottom-2 left-2 right-2 z-30 max-w-[600px] mx-auto flex flex-col gap-1"
      aria-label={t('lyrics.nowPlaying', 'Tocando agora')}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      <div className="absolute inset-0 rounded-full pointer-events-none z-0" />

      {currentTrack && (
        <ProgressBar
          progress={currentProgress}
          duration={currentTrack.duration_ms}
          onChange={handleSeek}
        />
      )}

      <div className="relative px-4 py-3 flex items-center gap-3">
        <TrackInfo progress={currentProgress} notes={notes} />
        <FavoriteButton isSaved={isSaved} addTrack={addTrack} removeTrack={removeTrack} />
        <PlaybackControls />
      </div>
    </motion.aside>
  )
}
