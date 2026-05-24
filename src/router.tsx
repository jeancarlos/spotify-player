/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppRoot } from '@/components/layout/AppRoot'
import { AppShell } from '@/components/layout/AppShell'
import { PlayerView } from '@/components/layout/PlayerView'

// Lazy load pages
const Login = lazy(() => import('@/pages/Login').then((module) => ({ default: module.Login })))
const OAuthCallback = lazy(() =>
  import('@/pages/OAuthCallback').then((module) => ({ default: module.OAuthCallback }))
)
const AuthError = lazy(() =>
  import('@/pages/AuthError').then((module) => ({ default: module.AuthError }))
)
const Home = lazy(() => import('@/pages/Home').then((module) => ({ default: module.Home })))
const Artists = lazy(() =>
  import('@/pages/Artists').then((module) => ({ default: module.Artists }))
)
const ArtistDetail = lazy(() =>
  import('@/pages/ArtistDetail').then((module) => ({ default: module.ArtistDetail }))
)
const AlbumDetail = lazy(() =>
  import('@/pages/AlbumDetail').then((module) => ({ default: module.AlbumDetail }))
)
const PlaylistDetail = lazy(() =>
  import('@/pages/PlaylistDetail').then((module) => ({ default: module.PlaylistDetail }))
)
const Favorites = lazy(() =>
  import('@/pages/Favorites').then((module) => ({ default: module.Favorites }))
)
const Profile = lazy(() =>
  import('@/pages/Profile').then((module) => ({ default: module.Profile }))
)

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="w-8 h-8 border-4 border-green-500 rounded-full border-t-transparent animate-spin" />
  </div>
)

const withSuspense = (Component: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>{Component}</Suspense>
)

export const router = createBrowserRouter([
  {
    element: <AppRoot />,
    children: [
      { path: '/login', element: withSuspense(<Login />) },
      { path: '/callback', element: withSuspense(<OAuthCallback />) },
      { path: '/auth-error', element: withSuspense(<AuthError />) },
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
          { index: true, element: withSuspense(<Home />) },
          { path: 'artists', element: withSuspense(<Artists />) },
          { path: 'artists/:id', element: withSuspense(<ArtistDetail />) },
          { path: 'albums/:id', element: withSuspense(<AlbumDetail />) },
          { path: 'playlists/:id', element: withSuspense(<PlaylistDetail />) },
          { path: 'favorites', element: withSuspense(<Favorites />) },
          { path: 'profile', element: withSuspense(<Profile />) },
        ],
      },
    ],
  },
])
