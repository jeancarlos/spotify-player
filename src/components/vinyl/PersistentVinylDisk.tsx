import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { VinylDisk } from './VinylDisk'
import { usePlayer } from '@/contexts/PlayerContext'
import { useFavorites } from '@/hooks/useFavorites'
import type { SpotifyTrack } from '@/types/spotify'

const PLAYER_CLEARANCE = 136

interface VinylDiskDisplayProps {
  albumArt?: string
  albumName?: string
  favoriteLabel?: string
}

function getVinylDiskProps(
  track: SpotifyTrack | null,
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

interface VinylPositions {
  homeY: number
  otherY: number
}

function getVinylY(
  isHome: boolean,
  playerHovered: boolean,
  pos: VinylPositions
): number {
  if (isHome) return pos.homeY
  if (playerHovered) return pos.homeY
  return pos.otherY
}

function useVinylY() {
  const [vw, setVw] = useState(() => window.innerWidth)
  useEffect(() => {
    const fn = () => {
      setVw(window.innerWidth)
    }
    window.addEventListener('resize', fn)
    return () => {
      window.removeEventListener('resize', fn)
    }
  }, [])
  const diskPx = Math.min(720, vw)
  return {
    homeY: Math.round(diskPx * 0.28),
    otherY: diskPx - PLAYER_CLEARANCE,
  }
}

interface PersistentVinylDiskProps {
  playerHovered?: boolean
}

export function PersistentVinylDisk({ playerHovered = false }: PersistentVinylDiskProps) {
  const location = useLocation()
  const { state } = usePlayer()
  const { homeY, otherY } = useVinylY()

  const { tracks, notes } = useFavorites()
  const isFavorite = tracks.some((t) => t.uri === state.currentTrack?.uri)

  const isHome = location.pathname === '/'

  const y = getVinylY(isHome, playerHovered, { homeY, otherY })
  const diskProps = getVinylDiskProps(state.currentTrack, notes, isFavorite)

  return (
    <div className="fixed inset-x-0 bottom-0 z-[15] pointer-events-none flex justify-center">
      <motion.div
        animate={{ y }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        initial={false}
      >
        <VinylDisk size="xl" isPlaying={state.isPlaying} {...diskProps} />
      </motion.div>
    </div>
  )
}
