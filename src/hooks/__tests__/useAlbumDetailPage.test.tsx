import type { ReactNode } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useAlbumDetailPage } from '../useAlbumDetailPage'
import type { Track } from '@/types/music'

const playTrack = vi.fn()
const tracks = [
  { id: '1', uri: 'u1', is_playable: false },
  { id: '2', uri: 'u2', preview_url: 'http://p/2' },
  { id: '3', uri: 'u3', preview_url: 'http://p/3' },
] as unknown as Track[]

vi.mock('@/contexts/PlayerContext', () => ({
  usePlayer: () => ({ state: {}, controls: { playTrack } }),
}))
vi.mock('@/hooks/queries/useAlbum', () => ({
  useAlbum: () => ({ data: undefined }),
}))
const rest = Array.from({ length: 30 }, (_, i) => ({ id: `r${i}`, uri: `ur${i}`, preview_url: 'http://p/r' }))
const allTracks = [...tracks, ...rest] as unknown as Track[]

vi.mock('@/hooks/queries/useAlbumTracks', () => ({
  useAlbumTracks: (_id: string, _page: number, limit: number) =>
    limit === 20
      ? { data: { items: tracks, offset: 0, limit: 20, total: 33 } }
      : { data: { items: allTracks, offset: 0, limit, total: 33 } },
}))

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>


function Probe() {
  return <p data-testid="probe">{JSON.stringify(useLocation().state)}</p>
}

describe('useAlbumDetailPage playback', () => {
  it('Play starts the first playable track with the full list', () => {
    const { result } = renderHook(() => useAlbumDetailPage(), { wrapper })
    result.current.handlePlay()
    expect(playTrack).toHaveBeenCalledWith(tracks[1], allTracks)
  })

  it('queues the whole album, not just the visible page', async () => {
    const { result } = renderHook(() => useAlbumDetailPage(), { wrapper })
    await result.current.handleTrackPlay(tracks[2], 2)
    expect(playTrack).toHaveBeenCalledWith(tracks[2], allTracks, 2)
  })

  it('navigates with the full current path, query included, as from', () => {
    const routedWrapper = ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={['/albums/3?page=2']}>
        <Routes>
          <Route path="/albums/:id" element={children} />
          <Route path="*" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    )
    const { result } = renderHook(() => useAlbumDetailPage(), { wrapper: routedWrapper })
    act(() => {
      result.current.handleArtistClick('ar1')
    })
    expect(screen.getByTestId('probe').textContent).toBe(JSON.stringify({ from: '/albums/3?page=2' }))
  })
})
