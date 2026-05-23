import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { PersistentVinylDisk } from '@/components/vinyl/PersistentVinylDisk'
import { MiniPlayer } from './MiniPlayer'
import { usePlayerSync } from '@/hooks/usePlayerSync'

const HIDE_PLAYER_ROUTES = ['/login', '/callback']

export function AppRoot() {
  const location = useLocation()
  const showPlayer = !HIDE_PLAYER_ROUTES.includes(location.pathname)
  
  // Sincronização global do player (progresso, faixa atual, play/pause)
  usePlayerSync()

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
