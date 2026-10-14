import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useArtistDetailPage } from '../useArtistDetailPage'
import { DeezerError } from '@/lib/deezer'
import type { Track, AlbumSimple } from '@/types/music'

const playTrack = vi.fn()
const top = [{ id: '1', uri: 'u1', preview_url: 'http://p/1' }] as unknown as Track[]

let playerState: { currentTrack?: { id: string } } = {}
vi.mock('@/contexts/PlayerContext', () => ({
  usePlayer: () => ({ state: playerState, controls: { playTrack } }),
}))
let artistResult: { data?: unknown; error?: unknown } = { data: undefined }
let albumsResult: { data?: unknown } = { data: undefined }
vi.mock('@/hooks/queries/useArtist', () => ({ useArtist: () => artistResult }))
vi.mock('@/hooks/queries/useArtistAlbums', () => ({ useArtistAlbums: () => albumsResult }))
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

  it('resets the album page when the artist changes', () => {
    const { result, rerender } = renderHook(({ id }) => useArtistDetailPage(id), {
      wrapper,
      initialProps: { id: '9' },
    })
    act(() => {
      result.current.setAlbumPage(2)
    })
    expect(result.current.albumPage).toBe(2)
    rerender({ id: '10' })
    expect(result.current.albumPage).toBe(1)
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
      result.current.handleAlbumClick({ id: 'al1' } as AlbumSimple)
    })
    expect(screen.getByTestId('probe').textContent).toBe(JSON.stringify({ from: '/artists/9?view=grid' }))
  })
})

describe('useArtistDetailPage data', () => {
  afterEach(() => {
    artistResult = { data: undefined }
    albumsResult = { data: undefined }
    playerState = {}
  })

  it('exposes the id of the playing track', () => {
    playerState = { currentTrack: { id: '77' } }
    const { result } = renderHook(() => useArtistDetailPage('9'), { wrapper })
    expect(result.current.activeTrackId).toBe('77')
  })

  it('has blank metadata and no next page before loading', () => {
    const { result } = renderHook(() => useArtistDetailPage('9'), { wrapper })
    expect(result.current.artistName).toBe('')
    expect(result.current.artistImages).toEqual([])
    expect(result.current.hasNextAlbums).toBe(false)
    expect(result.current.notFound).toBe(false)
  })

  it('derives metadata and paging from loaded data', () => {
    artistResult = { data: { name: 'Art', images: [{ url: 'u' }], link: 'http://l' } }
    albumsResult = { data: { items: [{ id: 'al' }], offset: 0, limit: 10, total: 25 } }
    const { result } = renderHook(() => useArtistDetailPage('9'), { wrapper })
    expect(result.current.artistName).toBe('Art')
    expect(result.current.artistLink).toBe('http://l')
    expect(result.current.albumItems).toHaveLength(1)
    expect(result.current.hasNextAlbums).toBe(true)
  })

  it('reports not found on a Deezer no-data error', () => {
    artistResult = { data: undefined, error: new DeezerError(800, 'no data') }
    const { result } = renderHook(() => useArtistDetailPage('9'), { wrapper })
    expect(result.current.notFound).toBe(true)
  })

  it('stores the header height', () => {
    const { result } = renderHook(() => useArtistDetailPage('9'), { wrapper })
    act(() => {
      result.current.handleHeaderHeightChange(80)
    })
    expect(result.current.headerHeight).toBe(80)
  })
})
