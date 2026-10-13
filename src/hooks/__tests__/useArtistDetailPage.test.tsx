import type { ReactNode } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useArtistDetailPage } from '../useArtistDetailPage'
import type { SpotifyTrack } from '@/types/spotify'

const playTrack = vi.fn()
const top = [{ id: '1', uri: 'u1', preview_url: 'http://p/1' }] as unknown as SpotifyTrack[]

vi.mock('@/contexts/PlayerContext', () => ({
  usePlayer: () => ({ state: {}, dispatch: vi.fn(), controls: { playTrack } }),
}))
vi.mock('@/hooks/queries/useArtist', () => ({ useArtist: () => ({ data: undefined }) }))
vi.mock('@/hooks/queries/useArtistAlbums', () => ({ useArtistAlbums: () => ({ data: undefined }) }))
vi.mock('@/hooks/queries/useArtistTopTracks', () => ({
  useArtistTopTracks: () => ({ data: top }),
}))

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>

describe('useArtistDetailPage playback', () => {
  it('exposes the local player playTrack', () => {
    const { result } = renderHook(() => useArtistDetailPage('9'), { wrapper })
    void result.current.playTrack(top[0], top)
    expect(playTrack).toHaveBeenCalledWith(top[0], top)
  })
})
