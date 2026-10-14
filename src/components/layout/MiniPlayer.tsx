import { motion } from 'framer-motion'
import { usePlayer } from '@/contexts/PlayerContext'
import { useFavorites } from '@/hooks/useFavorites'
import { useTranslation } from 'react-i18next'
import { ProgressBar } from './mini-player/ProgressBar'
import { TrackInfo } from './mini-player/TrackInfo'
import { PlaybackControls } from './mini-player/PlaybackControls'
import { FavoriteButton } from './mini-player/FavoriteButton'

export function MiniPlayer() {
  const { state } = usePlayer()
  const { currentTrack } = state
  const { notes } = useFavorites()
  const { t } = useTranslation()

  return (
    <motion.aside
      initial={{ y: 300 }}
      animate={{ y: 0 }}
      exit={{ y: 300 }}
      transition={{ type: 'spring', stiffness: 240, damping: 26 }}
      className="group/miniplayer rounded-full glass shadow-xl fixed bottom-2 left-2 right-2 z-30 max-w-[600px] mx-auto flex flex-col gap-1"
      aria-label={t('lyrics.nowPlaying', 'Tocando agora')}
    >
      <div className="absolute inset-0 rounded-full pointer-events-none z-0" />

      {currentTrack && <ProgressBar />}

      <div className="relative px-4 py-3 flex items-center gap-3">
        <TrackInfo notes={notes} />
        <FavoriteButton />
        <PlaybackControls />
      </div>
    </motion.aside>
  )
}
