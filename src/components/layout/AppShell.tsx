import { Outlet } from 'react-router-dom'
import { DynamicBackground } from './DynamicBackground'
import { Sidebar } from './Sidebar'
import { MiniPlayer } from './MiniPlayer'
import { FullscreenPlayer } from './FullscreenPlayer'

export function AppShell() {
  return (
    <>
      <DynamicBackground />
      <FullscreenPlayer />
      <div className="flex h-screen overflow-hidden gap-2 p-2">
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
