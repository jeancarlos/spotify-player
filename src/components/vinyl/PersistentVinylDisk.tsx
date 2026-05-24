import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { VinylDisk } from './VinylDisk'
import { usePlayer } from '@/hooks/usePlayer'
import { useAuth } from '@/hooks/useAuth'
import { useIsTrackFavorite } from '@/hooks/useIsTrackFavorite'

// bottom-2 gap (8px) + player height (~68px) + peek above player (~60px)
const PLAYER_CLEARANCE = 136

function useVinylY() {
  const [vw, setVw] = useState(() => window.innerWidth)
  useEffect(() => {
    const fn = () => setVw(window.innerWidth)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  const diskPx = Math.min(720, vw)
  return {
    loginY: Math.round(diskPx * 0.5),
    homeY: Math.round(diskPx * 0.28),
    otherY: diskPx - PLAYER_CLEARANCE,
  }
}

interface PersistentVinylDiskProps {
  playerHovered?: boolean
}

export function PersistentVinylDisk({ playerHovered = false }: PersistentVinylDiskProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const { state } = usePlayer()
  const { state: authState } = useAuth()
  const { loginY, homeY, otherY } = useVinylY()

  // Identifica se a faixa atual está nos favoritos locais do usuário
  const userId = authState.profile?.id ?? ''
  const isFavorite = useIsTrackFavorite(state.currentTrack?.uri, userId)

  const isLogin = location.pathname === '/login'
  const isHome = location.pathname === '/'

  const albumArt = state.currentTrack?.album.images[0]?.url
  const albumName = state.currentTrack?.album.name

  const y = isLogin ? loginY : isHome ? homeY : playerHovered ? homeY : otherY

  return (
    <div className="fixed inset-x-0 bottom-0 z-[3] pointer-events-none flex justify-center">
      <motion.div
        animate={{ y }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        initial={false}
      >
        <VinylDisk
          size="xl"
          isPlaying={state.isPlaying}
          albumArt={isLogin ? undefined : albumArt}
          albumName={isLogin ? undefined : albumName}
          favoriteLabel={isFavorite && !isLogin ? t('favorites.isFavorite') : undefined}
        />
      </motion.div>
    </div>
  )
}
