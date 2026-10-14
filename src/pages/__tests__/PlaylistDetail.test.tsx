import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { PlaylistDetail } from '../PlaylistDetail'
import type { Track } from '@/types/music'

const tracks = [
  {
    id: 't1',
    name: 'First',
    duration_ms: 1000,
    explicit: false,
    preview_url: 'https://cdn.test/t1.mp3',
    artists: [{ id: 'a1', name: 'Artist' }],
    album: { id: 'alb1', name: 'Album One', images: [] },
  },
] as unknown as Track[]

const hook = {
  playlist: { data: undefined },
  playlistTracks: tracks,
  playerState: { currentTrack: null },
  view: 'table',
  setView: vi.fn(),
  page: 3,
  setPage: vi.fn(),
  headerHeight: 0,
  hasNext: false,
  subtitle: '',
  handlePlay: vi.fn(),
  handleLayout: vi.fn(),
  playTrack: vi.fn(),
  notFound: false,
}

vi.mock('@/hooks/usePlaylistDetailPage', () => ({
  PLAYLIST_LIMIT: 20,
  usePlaylistDetailPage: () => hook,
}))
vi.mock('@/components/shared/CollectionHeader', () => ({ CollectionHeader: () => <div /> }))
vi.mock('@/components/shared/ListTableSwitch', () => ({ ListTableSwitch: () => <div /> }))
vi.mock('@/components/shared/Pagination', () => ({ Pagination: () => <div /> }))

function Probe() {
  const l = useLocation()
  return <output data-testid="loc">{JSON.stringify({ p: l.pathname, s: l.state })}</output>
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/playlists/9', search: '?page=3' }]}>
      <Routes>
        <Route path="/playlists/:id" element={<PlaylistDetail />} />
        <Route path="*" element={null} />
      </Routes>
      <Probe />
    </MemoryRouter>
  )
}

describe('PlaylistDetail table view', () => {
  it('navigates to the album when the album cell is clicked', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Album One' }))
    expect(JSON.parse(screen.getByTestId('loc').textContent)).toEqual({
      p: '/albums/alb1',
      s: { from: '/playlists/9?page=3' },
    })
  })

  it('continues row numbers across pages', () => {
    renderPage()
    expect(screen.getByText('41')).toBeInTheDocument()
  })

  it('keeps the track list in the same centred column as album pages', () => {
    renderPage()
    expect(screen.getByText('41').closest('.max-w-3xl')).not.toBeNull()
  })

  it('shows a not-found state instead of an empty header when Deezer has no data', () => {
    hook.notFound = true
    renderPage()
    expect(screen.getByText('common.notFound')).toBeInTheDocument()
    expect(screen.queryByText('41')).toBeNull()
    hook.notFound = false
  })
})
