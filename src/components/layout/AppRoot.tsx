import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { PersistentVinylDisk } from '@/components/vinyl/PersistentVinylDisk'
import { MiniPlayer } from './MiniPlayer'

export function AppRoot() {
  const [playerHovered, setPlayerHovered] = useState(false)


  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key="app"
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
        <MiniPlayer key="mini-player" onHoverChange={setPlayerHovered} />
      </AnimatePresence>
    </>
  )
}
