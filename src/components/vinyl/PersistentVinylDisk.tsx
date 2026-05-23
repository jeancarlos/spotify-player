import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { VinylDisk } from './VinylDisk'
import { usePlayer } from '@/hooks/usePlayer'

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
  }
}

export function PersistentVinylDisk() {
  const location = useLocation()
  const { state } = usePlayer()
  const { loginY, homeY } = useVinylY()

  const isLogin = location.pathname === '/login'
  const isHome = location.pathname === '/'

  if (!isLogin && !isHome) return null

  const albumArt = state.currentTrack?.album.images[0]?.url

  return (
    <div className="fixed inset-x-0 bottom-0 z-[3] pointer-events-none flex justify-center">
      <motion.div
        animate={{ y: isLogin ? loginY : homeY }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        initial={false}
      >
        <VinylDisk
          size="xl"
          isPlaying={isHome && state.isPlaying}
          albumArt={isHome ? albumArt : undefined}
        />
      </motion.div>
    </div>
  )
}
