import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { PersistentVinylDisk } from '@/components/vinyl/PersistentVinylDisk'
import { MiniPlayer } from './MiniPlayer'
import { usePlayerSync } from '@/hooks/usePlayerSync'

const HIDE_PLAYER_ROUTES = ['/login', '/callback']

function routeGroup(pathname: string) {
  return HIDE_PLAYER_ROUTES.includes(pathname) ? pathname : 'app'
}

export function AppRoot() {
  const location = useLocation()
  const showPlayer = !HIDE_PLAYER_ROUTES.includes(location.pathname)
  const [playerHovered, setPlayerHovered] = useState(false)

  usePlayerSync()

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={routeGroup(location.pathname)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeInOut' }}
          className="h-full"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      <PersistentVinylDisk playerHovered={playerHovered} />
      <AnimatePresence>
        {showPlayer && <MiniPlayer key="mini-player" onHoverChange={setPlayerHovered} />}
      </AnimatePresence>
    </>
  )
}
