import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { Login } from '@/pages/Login'
import { OAuthCallback } from '@/pages/OAuthCallback'
import { Home } from '@/pages/Home'
import { Artists } from '@/pages/Artists'
import { ArtistDetail } from '@/pages/ArtistDetail'
import { Profile } from '@/pages/Profile'
import { Favorites } from '@/pages/Favorites'

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/callback', element: <OAuthCallback /> },
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
      { path: 'profile', element: <Profile /> },
      { path: 'favorites', element: <Favorites /> },
    ],
  },
])
