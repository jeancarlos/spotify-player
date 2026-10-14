import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useAlbumDetailPage } from '../useAlbumDetailPage'
import { DeezerError } from '@/lib/deezer'
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
let albumResult: { data?: unknown; error?: unknown } = { data: undefined }
vi.mock('@/hooks/queries/useAlbum', () => ({
  useAlbum: () => albumResult,
}))
const rest = Array.from({ length: 30 }, (_, i) => ({ id: `r${i}`, uri: `ur${i}`, preview_url: 'http://p/r' }))
const allTracks = [...tracks, ...rest] as unknown as Track[]

let fullListFailed = false
let pageEmpty = false
vi.mock('@/hooks/queries/useAlbumTracks', () => ({
  useAlbumTracks: (_id: string, _page: number, limit: number) => {
    if (limit === 20 && pageEmpty) return { data: undefined }
    if (limit === 20) return { data: { items: tracks, offset: 0, limit: 20, total: 33 } }
    return fullListFailed
      ? { data: undefined, isError: true }
      : { data: { items: allTracks, offset: 0, limit, total: 33 } }
  },
}))

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>


function Probe() {
  return <p data-testid="probe">{JSON.stringify(useLocation().state)}</p>
}

describe('useAlbumDetailPage playback', () => {
  it('Play starts the first playable track with the full list', async () => {
    const { result } = renderHook(() => useAlbumDetailPage(), { wrapper })
    result.current.handlePlay()
    await waitFor(() => {
      expect(playTrack).toHaveBeenCalledWith(tracks[1], allTracks)
    })
  })

  it('falls back to the visible page with a page-relative index when the full list failed', async () => {
    fullListFailed = true
    const { result } = renderHook(() => useAlbumDetailPage(), { wrapper })
    await result.current.handleTrackPlay(tracks[2], 2)
    expect(playTrack).toHaveBeenCalledWith(tracks[2], tracks, 2)
    fullListFailed = false
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

describe('useAlbumDetailPage metadata', () => {
  afterEach(() => {
    albumResult = { data: undefined }
    pageEmpty = false
  })

  it('has blank metadata before the album loads', () => {
    const { result } = renderHook(() => useAlbumDetailPage(), { wrapper })
    expect(result.current.albumName).toBe('')
    expect(result.current.albumSubtitle).toBe('')
    expect(result.current.albumYear).toBeUndefined()
    expect(result.current.notFound).toBe(false)
  })

  it('derives metadata from the loaded album', () => {
    albumResult = {
      data: {
        id: 'al1',
        name: 'Album',
        images: [{ url: 'u' }],
        release_date: '2020-05-01',
        artists: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
        link: 'http://l',
      },
    }
    const { result } = renderHook(() => useAlbumDetailPage(), { wrapper })
    expect(result.current.albumName).toBe('Album')
    expect(result.current.albumSubtitle).toBe('A, B')
    expect(result.current.albumYear).toBe('2020')
    expect(result.current.albumLink).toBe('http://l')
    expect(result.current.hasNext).toBe(true)
  })

  it('reports not found on a Deezer no-data error', () => {
    albumResult = { data: undefined, error: new DeezerError(800, 'no data') }
    const { result } = renderHook(() => useAlbumDetailPage(), { wrapper })
    expect(result.current.notFound).toBe(true)
  })

  it('has no next page and no items before the tracks load', () => {
    pageEmpty = true
    const { result } = renderHook(() => useAlbumDetailPage(), { wrapper })
    expect(result.current.hasNext).toBe(false)
    expect(result.current.albumItems).toEqual([])
  })

  it('stores the header height', () => {
    const { result } = renderHook(() => useAlbumDetailPage(), { wrapper })
    act(() => {
      result.current.handleLayout(120)
    })
    expect(result.current.headerHeight).toBe(120)
  })

  it('does not play when the queue has no playable track', async () => {
    pageEmpty = true
    fullListFailed = true
    const { result } = renderHook(() => useAlbumDetailPage(), { wrapper })
    playTrack.mockClear()
    result.current.handlePlay()
    await new Promise((r) => setTimeout(r, 20))
    expect(playTrack).not.toHaveBeenCalled()
    fullListFailed = false
  })
})
