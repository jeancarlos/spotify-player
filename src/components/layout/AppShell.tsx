import { Outlet } from 'react-router-dom'
import { HamburgerMenu } from './HamburgerMenu'
import { PlayerSync } from './PlayerSync'
import { LyricsPreloader } from './LyricsPreloader'
import { QueryErrorHandler } from './QueryErrorHandler'
import { ReloadPrompt } from './ReloadPrompt'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

export function AppShell() {
  return (
    <>
      <PlayerSync />
      <LyricsPreloader />
      <QueryErrorHandler />
      <ReloadPrompt />
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>
      <HamburgerMenu />
      <LanguageSwitcher className="fixed top-4 right-4 z-40" />
      <main className="relative z-[1] h-full overflow-y-auto">
        <Outlet />
      </main>
    </>
  )
}
