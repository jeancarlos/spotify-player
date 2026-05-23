import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { PersistentVinylDisk } from '@/components/vinyl/PersistentVinylDisk'
import { MiniPlayer } from './MiniPlayer'

const HIDE_PLAYER_ROUTES = ['/login', '/callback']

export function AppRoot() {
  const location = useLocation()
  const showPlayer = !HIDE_PLAYER_ROUTES.includes(location.pathname)

  return (
    <>
      <Outlet />
      <PersistentVinylDisk />
      <AnimatePresence>
        {showPlayer && <MiniPlayer key="mini-player" />}
      </AnimatePresence>
    </>
  )
}
