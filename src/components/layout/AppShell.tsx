import { Outlet } from 'react-router-dom'
import { DynamicBackground } from './DynamicBackground'
import { Sidebar } from './Sidebar'
import { MiniPlayer } from './MiniPlayer'

export function AppShell() {
  return (
    <>
      <DynamicBackground />
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
