import { Outlet } from 'react-router-dom'
import { PersistentVinylDisk } from '@/components/vinyl/PersistentVinylDisk'

export function AppRoot() {
  return (
    <>
      <Outlet />
      <PersistentVinylDisk />
    </>
  )
}
