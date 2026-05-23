import { Outlet } from 'react-router-dom'
import { HamburgerMenu } from './HamburgerMenu'
import { MiniPlayer } from './MiniPlayer'
import { PlayerSync } from './PlayerSync'
import { QueryErrorHandler } from './QueryErrorHandler'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

export function AppShell() {
  return (
    <>
      <PlayerSync />
      <QueryErrorHandler />
      <HamburgerMenu />
      <LanguageSwitcher className="fixed top-4 right-4 z-40" />
      <main className="min-h-screen bg-white pb-20">
        <Outlet />
        <MiniPlayer />
      </main>
    </>
  )
}
