import type { ReactNode } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
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
const allTracks = [...tracks, { id: '3', uri: 'u3', preview_url: 'http://p/3' }] as unknown as Track[]

vi.mock('@/hooks/queries/usePlaylistTracks', () => ({
  usePlaylistTracks: (_id: string, _enabled: boolean, _page: number, limit: number) =>
    limit === 20
      ? { data: { items: tracks, offset: 0, limit: 20, total: 3 } }
      : { data: { items: allTracks, offset: 0, limit, total: 3 } },
}))

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>

describe('usePlaylistDetailPage playback', () => {
  it('Play starts the first playable track with the full list', async () => {
    const { result } = renderHook(() => usePlaylistDetailPage(), { wrapper })
    result.current.handlePlay()
    await waitFor(() => {
      expect(playTrack).toHaveBeenCalledWith(tracks[1], allTracks)
    })
  })

  it('queues the whole playlist, not just the visible page', async () => {
    const { result } = renderHook(() => usePlaylistDetailPage(), { wrapper })
    await result.current.playTrack(tracks[1], 1)
    expect(playTrack).toHaveBeenCalledWith(tracks[1], allTracks, 1)
  })
})
