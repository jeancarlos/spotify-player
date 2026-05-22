import { Outlet } from 'react-router-dom'
import { usePlayer } from '@/hooks/usePlayer'
import { DynamicBackground } from './DynamicBackground'
import { Sidebar } from './Sidebar'
import { MiniPlayer } from './MiniPlayer'
import { FullscreenPlayer } from './FullscreenPlayer'
import { PlayerSync } from './PlayerSync'
import { QueryErrorHandler } from './QueryErrorHandler'

export function AppShell() {
  const { state } = usePlayer()
  const [primary, secondary] = state.palette ?? ['45,27,105', '22,33,62']

  return (
    <>
      <DynamicBackground />
      <PlayerSync />
      <QueryErrorHandler />
      <FullscreenPlayer />
      <div
        className="flex h-screen overflow-hidden gap-2 p-2"
        style={
          {
            '--color-primary': `rgb(${primary})`,
            '--color-secondary': `rgb(${secondary})`,
          } as React.CSSProperties
        }
      >
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden gap-2">
          <main className="flex-1 overflow-y-auto rounded-2xl">
            <Outlet />
          </main>
          <MiniPlayer />
        </div>
      </div>
    </>
  )
}
