import type { ReactNode } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { usePlaylistDetailPage } from '../usePlaylistDetailPage'
import type { Track } from '@/types/music'

const playTrack = vi.fn()
const tracks = [
  { id: '1', uri: 'u1', is_playable: false },
  { id: '2', uri: 'u2', preview_url: 'http://p/2' },
] as unknown as Track[]

vi.mock('@/contexts/PlayerContext', () => ({
  usePlayer: () => ({ state: {}, controls: { playTrack } }),
}))
vi.mock('@/hooks/queries/usePlaylist', () => ({
  usePlaylist: () => ({ data: undefined }),
}))
vi.mock('@/hooks/queries/usePlaylistTracks', () => ({
  usePlaylistTracks: () => ({
    data: { items: tracks, offset: 0, limit: 20, total: 2 },
  }),
}))

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>

describe('usePlaylistDetailPage playback', () => {
  it('Play starts the first playable track with the full list', () => {
    const { result } = renderHook(() => usePlaylistDetailPage(), { wrapper })
    result.current.handlePlay()
    expect(playTrack).toHaveBeenCalledWith(tracks[1], tracks)
  })
})
