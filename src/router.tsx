/* eslint-disable react-refresh/only-export-components */
import { Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppRoot } from '@/components/layout/AppRoot'
import { AppShell } from '@/components/layout/AppShell'
import { PlayerView } from '@/components/layout/PlayerView'
import { lazyWithRetry } from '@/utils/lazyWithRetry'

const Login = lazyWithRetry(
  async () => import('@/pages/Login').then((m) => ({ default: m.Login })),
  'Login'
)
const OAuthCallback = lazyWithRetry(
  async () => import('@/pages/OAuthCallback').then((m) => ({ default: m.OAuthCallback })),
  'OAuthCallback'
)
const AuthError = lazyWithRetry(
  async () => import('@/pages/AuthError').then((m) => ({ default: m.AuthError })),
  'AuthError'
)
const Home = lazyWithRetry(
  async () => import('@/pages/Home').then((m) => ({ default: m.Home })),
  'Home'
)
const Artists = lazyWithRetry(
  async () => import('@/pages/Artists').then((m) => ({ default: m.Artists })),
  'Artists'
)
const ArtistDetail = lazyWithRetry(
  async () => import('@/pages/ArtistDetail').then((m) => ({ default: m.ArtistDetail })),
  'ArtistDetail'
)
const AlbumDetail = lazyWithRetry(
  async () => import('@/pages/AlbumDetail').then((m) => ({ default: m.AlbumDetail })),
  'AlbumDetail'
)
const PlaylistDetail = lazyWithRetry(
  async () => import('@/pages/PlaylistDetail').then((m) => ({ default: m.PlaylistDetail })),
  'PlaylistDetail'
)
const Favorites = lazyWithRetry(
  async () => import('@/pages/Favorites').then((m) => ({ default: m.Favorites })),
  'Favorites'
)
const Profile = lazyWithRetry(
  async () => import('@/pages/Profile').then((m) => ({ default: m.Profile })),
  'Profile'
)

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
