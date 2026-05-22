import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { UIProvider } from '@/contexts/UIContext'
import { PlayerProvider } from '@/contexts/PlayerContext'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/router'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UIProvider>
          <PlayerProvider>
            <RouterProvider router={router} />
          </PlayerProvider>
        </UIProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
