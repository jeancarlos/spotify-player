import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { usePlaylistDetailPage } from '../usePlaylistDetailPage'
import { DeezerError } from '@/lib/deezer'
import type { Track } from '@/types/music'

const playTrack = vi.fn()
const tracks = [
  { id: '1', uri: 'u1', is_playable: false },
  { id: '2', uri: 'u2', preview_url: 'http://p/2' },
] as unknown as Track[]

vi.mock('@/contexts/PlayerContext', () => ({
  usePlayer: () => ({ state: {}, controls: { playTrack } }),
}))
let playlistResult: { data?: unknown; error?: unknown } = { data: undefined }
vi.mock('@/hooks/queries/usePlaylist', () => ({
  usePlaylist: () => playlistResult,
}))
let fullListFailed = false
let pageTotal = 3
let pageEmpty = false
const allTracks = [...tracks, { id: '3', uri: 'u3', preview_url: 'http://p/3' }] as unknown as Track[]

vi.mock('@/hooks/queries/usePlaylistTracks', () => ({
  usePlaylistTracks: (_id: string, _enabled: boolean, _page: number, limit: number) => {
    if (limit === 20 && pageEmpty) return { data: undefined }
    if (limit === 20) return { data: { items: tracks, offset: 0, limit: 20, total: pageTotal } }
    return fullListFailed
      ? { data: undefined, isError: true }
      : { data: { items: allTracks, offset: 0, limit, total: 3 } }
  },
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

describe('usePlaylistDetailPage data', () => {
  afterEach(() => {
    playlistResult = { data: undefined }
    fullListFailed = false
    pageTotal = 3
    pageEmpty = false
  })

  it('has no items, no next page and plays nothing before the tracks load', async () => {
    pageEmpty = true
    fullListFailed = true
    const { result } = renderHook(() => usePlaylistDetailPage(), { wrapper })
    expect(result.current.playlistTracks).toEqual([])
    expect(result.current.hasNext).toBe(false)
    playTrack.mockClear()
    result.current.handlePlay()
    await new Promise((r) => setTimeout(r, 20))
    expect(playTrack).not.toHaveBeenCalled()
  })


  it('falls back to the visible page when the full list failed', async () => {
    fullListFailed = true
    const { result } = renderHook(() => usePlaylistDetailPage(), { wrapper })
    await result.current.playTrack(tracks[1], 1)
    expect(playTrack).toHaveBeenCalledWith(tracks[1], tracks, 1)
  })

  it('has an empty subtitle and no next page for an unowned, complete playlist', () => {
    const { result } = renderHook(() => usePlaylistDetailPage(), { wrapper })
    expect(result.current.subtitle).toBe('')
    expect(result.current.hasNext).toBe(false)
    expect(result.current.notFound).toBe(false)
  })

  it('builds the owner subtitle and reports a next page', () => {
    playlistResult = { data: { owner: { display_name: 'Ana' } } }
    pageTotal = 50
    const { result } = renderHook(() => usePlaylistDetailPage(), { wrapper })
    expect(result.current.subtitle).toBe('playlistDetail.owner')
    expect(result.current.hasNext).toBe(true)
  })

  it('reports not found on a Deezer no-data error', () => {
    playlistResult = { data: undefined, error: new DeezerError(800, 'no data') }
    const { result } = renderHook(() => usePlaylistDetailPage(), { wrapper })
    expect(result.current.notFound).toBe(true)
  })

  it('stores the header height', () => {
    const { result } = renderHook(() => usePlaylistDetailPage(), { wrapper })
    act(() => {
      result.current.handleLayout(60)
    })
    expect(result.current.headerHeight).toBe(60)
  })
})
