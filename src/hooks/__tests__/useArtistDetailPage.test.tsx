import type { ReactNode } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useArtistDetailPage } from '../useArtistDetailPage'
import type { SpotifyTrack, SpotifyAlbumSimple } from '@/types/spotify'

const playTrack = vi.fn()
const top = [{ id: '1', uri: 'u1', preview_url: 'http://p/1' }] as unknown as SpotifyTrack[]

vi.mock('@/contexts/PlayerContext', () => ({
  usePlayer: () => ({ state: {}, controls: { playTrack } }),
}))
vi.mock('@/hooks/queries/useArtist', () => ({ useArtist: () => ({ data: undefined }) }))
vi.mock('@/hooks/queries/useArtistAlbums', () => ({ useArtistAlbums: () => ({ data: undefined }) }))
vi.mock('@/hooks/queries/useArtistTopTracks', () => ({
  useArtistTopTracks: () => ({ data: top }),
}))

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>


function Probe() {
  return <p data-testid="probe">{JSON.stringify(useLocation().state)}</p>
}

describe('useArtistDetailPage playback', () => {
  it('exposes the local player playTrack', () => {
    const { result } = renderHook(() => useArtistDetailPage('9'), { wrapper })
    void result.current.playTrack(top[0], top)
    expect(playTrack).toHaveBeenCalledWith(top[0], top)
  })

  it('navigates with the full current path, query included, as from', () => {
    const routedWrapper = ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={['/artists/9?view=grid']}>
        <Routes>
          <Route path="/artists/:id" element={children} />
          <Route path="*" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    )
    const { result } = renderHook(() => useArtistDetailPage('9'), { wrapper: routedWrapper })
    act(() => {
      result.current.handleAlbumClick({ id: 'al1' } as SpotifyAlbumSimple)
    })
    expect(screen.getByTestId('probe').textContent).toBe(JSON.stringify({ from: '/artists/9?view=grid' }))
  })
})
