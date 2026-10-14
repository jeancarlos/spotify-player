import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { VinylDisk } from './VinylDisk'
import { usePlayer } from '@/contexts/PlayerContext'
import { useFavorites } from '@/hooks/useFavorites'
import { useWindowSize } from '@/hooks/useWindowSize'
import { homeDiskOffset, homeDiskPx } from '@/utils/diskLayout'
import type { Track } from '@/types/music'

const PLAYER_CLEARANCE = 136

interface VinylDiskDisplayProps {
  albumArt?: string
  albumName?: string
  favoriteLabel?: string
}

function getVinylDiskProps(
  track: Track | null,
  notes: Record<string, string>,
  isFavorite: boolean
): VinylDiskDisplayProps {
  if (!track) return {}
  const albumArt = track.album.images[0]?.url
  const albumName = track.album.name
  const currentNote = notes[track.uri]
  const favoriteLabel = isFavorite && currentNote ? currentNote : undefined
  return { albumArt, albumName, favoriteLabel }
}

function useVinylY() {
  const { width: vw, height: vh } = useWindowSize()
  const diskPx = Math.min(720, vw)
  return {
    homeY: homeDiskOffset(vw, vh),
    homeScale: homeDiskPx(vw, vh) / diskPx,
    otherY: diskPx - PLAYER_CLEARANCE,
  }
}

export function PersistentVinylDisk() {
  const location = useLocation()
  const { state } = usePlayer()
  const { homeY, homeScale, otherY } = useVinylY()

  const { tracks, notes } = useFavorites()
  const isFavorite = tracks.some((t) => t.uri === state.currentTrack?.uri)

  const isHome = location.pathname === '/'
  const y = isHome ? homeY : otherY
  const diskProps = getVinylDiskProps(state.currentTrack, notes, isFavorite)

  return (
    <div className="fixed inset-x-0 bottom-0 z-[15] pointer-events-none flex justify-center">
      <motion.div
        animate={{ y, scale: isHome ? homeScale : 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        initial={false}
        style={{ transformOrigin: '50% 100%' }}
      >
        <VinylDisk size="xl" isPlaying={state.isPlaying} {...diskProps} />
      </motion.div>
    </div>
  )
}
