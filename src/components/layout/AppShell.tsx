import { Outlet } from 'react-router-dom'
import { HamburgerMenu } from './HamburgerMenu'
import { MiniPlayer } from './MiniPlayer'
import { PlayerSync } from './PlayerSync'
import { QueryErrorHandler } from './QueryErrorHandler'

export function AppShell() {
  return (
    <>
      <PlayerSync />
      <QueryErrorHandler />
      <HamburgerMenu />
      <main className="min-h-screen bg-white pb-20">
        <Outlet />
        <MiniPlayer />
      </main>
    </>
  )
}
