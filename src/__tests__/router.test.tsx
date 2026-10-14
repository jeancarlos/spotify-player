import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type * as RouterDom from 'react-router-dom'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom'

vi.mock('@/components/layout/AppRoot', async () => {
  const { Outlet } = await import('react-router-dom')
  return { AppRoot: () => <Outlet /> }
})
vi.mock('@/components/layout/AppShell', async () => {
  const { Outlet } = await import('react-router-dom')
  return { AppShell: () => <Outlet /> }
})
vi.mock('@/components/layout/PlayerView', () => ({ PlayerView: () => <p>player-view</p> }))
vi.mock('@/pages/Home', () => ({ Home: () => <p>page-home</p> }))
vi.mock('@/pages/Artists', () => ({ Artists: () => <p>page-artists</p> }))
vi.mock('@/pages/ArtistDetail', () => ({ ArtistDetail: () => <p>page-artist-detail</p> }))
vi.mock('@/pages/AlbumDetail', () => ({ AlbumDetail: () => <p>page-album-detail</p> }))
vi.mock('@/pages/PlaylistDetail', () => ({ PlaylistDetail: () => <p>page-playlist-detail</p> }))
vi.mock('@/pages/Favorites', () => ({ Favorites: () => <p>page-favorites</p> }))
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof RouterDom>()
  return {
    ...actual,
    createBrowserRouter: (routes: RouteObject[]) => routes,
  }
})

describe('router', () => {
  const cases: [string, string][] = [
    ['/', 'page-home'],
    ['/artists', 'page-artists'],
    ['/artists/1', 'page-artist-detail'],
    ['/albums/1', 'page-album-detail'],
    ['/playlists/1', 'page-playlist-detail'],
    ['/favorites', 'page-favorites'],
    ['/player', 'player-view'],
    ['/nope', 'page-home'],
  ]

  it.each(cases)('routes %s', async (path, text) => {
    const { router } = await import('../router')
    const memory = createMemoryRouter(router as unknown as RouteObject[], { initialEntries: [path] })
    render(<RouterProvider router={memory} />)
    expect(await screen.findByText(text)).toBeInTheDocument()
  })
})
