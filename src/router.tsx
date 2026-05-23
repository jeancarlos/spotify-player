import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { PlayerView } from '@/components/layout/PlayerView'
import { Login } from '@/pages/Login'
import { OAuthCallback } from '@/pages/OAuthCallback'
import { Home } from '@/pages/Home'
import { Artists } from '@/pages/Artists'
import { ArtistDetail } from '@/pages/ArtistDetail'
import { Favorites } from '@/pages/Favorites'
import { Profile } from '@/pages/Profile'

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/callback', element: <OAuthCallback /> },
  {
    path: '/player',
    element: (
      <ProtectedRoute>
        <PlayerView />
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: 'artists', element: <Artists /> },
      { path: 'artists/:id', element: <ArtistDetail /> },
      { path: 'favorites', element: <Favorites /> },
      { path: 'profile', element: <Profile /> },
    ],
  },
])
