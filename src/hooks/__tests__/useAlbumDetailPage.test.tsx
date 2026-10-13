import type { ReactNode } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useAlbumDetailPage } from '../useAlbumDetailPage'
import type { SpotifyTrack } from '@/types/spotify'

const playTrack = vi.fn()
const tracks = [
  { id: '1', uri: 'u1', is_playable: false },
  { id: '2', uri: 'u2', preview_url: 'http://p/2' },
  { id: '3', uri: 'u3', preview_url: 'http://p/3' },
] as unknown as SpotifyTrack[]

vi.mock('@/contexts/PlayerContext', () => ({
  usePlayer: () => ({ state: {}, dispatch: vi.fn(), controls: { playTrack } }),
}))
vi.mock('@/hooks/queries/useAlbum', () => ({
  useAlbum: () => ({ data: undefined }),
}))
vi.mock('@/hooks/queries/useAlbumTracks', () => ({
  useAlbumTracks: () => ({ data: { items: tracks, offset: 0, limit: 20, total: 3 } }),
}))

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>

describe('useAlbumDetailPage playback', () => {
  it('Play starts the first playable track with the full list', () => {
    const { result } = renderHook(() => useAlbumDetailPage(), { wrapper })
    result.current.handlePlay()
    expect(playTrack).toHaveBeenCalledWith(tracks[1], tracks)
  })
})
