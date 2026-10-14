import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { deezer } from '@/lib/deezer'
import { toAlbum, toPlaylist, toTrack } from '@/lib/deezerMappers'
import { useAlbum } from '../useAlbum'
import { useAlbumTracks } from '../useAlbumTracks'
import { usePlaylist } from '../usePlaylist'
import { usePlaylistTracks } from '../usePlaylistTracks'
import album from '@/mocks/fixtures/deezer/album.json'
import albumTracks from '@/mocks/fixtures/deezer/album-tracks.json'
import playlist from '@/mocks/fixtures/deezer/playlist.json'
import playlistTracks from '@/mocks/fixtures/deezer/playlist-tracks.json'

vi.mock('@/lib/deezer', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  deezer: vi.fn(),
}))

const deezerMock = vi.mocked(deezer)

function respondByPath(responses: Record<string, unknown>) {
  deezerMock.mockImplementation((path: string) => Promise.resolve(responses[path]))
}

function renderWithClient<T>(hook: () => T) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return renderHook(hook, {
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children),
  })
}

beforeEach(() => {
  deezerMock.mockReset()
})

describe('album hooks', () => {
  it('useAlbum requests album/{id} and maps the full album', async () => {
    respondByPath({ 'album/301663': album })
    const { result } = renderWithClient(() => useAlbum('301663'))
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(deezerMock).toHaveBeenCalledWith('album/301663')
    expect(result.current.data).toEqual(toAlbum(album))
    expect(result.current.data?.label).toBe(album.label)
  })

  it('useAlbumTracks requests album/{id}/tracks with index and limit and attaches the album', async () => {
    respondByPath({ 'album/301663': album, 'album/301663/tracks': albumTracks })
    const { result } = renderWithClient(() => useAlbumTracks('301663', 2, 20))
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(deezerMock).toHaveBeenCalledWith('album/301663/tracks', { index: 20, limit: 20 })
    const mappedAlbum = toAlbum(album)
    expect(result.current.data?.items).toEqual(albumTracks.data.map((t) => toTrack(t, mappedAlbum)))
    expect(result.current.data?.items.every((t) => t.album.id === String(album.id))).toBe(true)
    expect(result.current.data?.offset).toBe(20)
    expect(result.current.data?.total).toBe(albumTracks.total)
  })

  it('useAlbum and useAlbumTracks share one album request', async () => {
    respondByPath({ 'album/301663': album, 'album/301663/tracks': albumTracks })
    const { result } = renderWithClient(() => ({
      album: useAlbum('301663'),
      tracks: useAlbumTracks('301663', 1),
    }))
    await waitFor(() => {
      expect(result.current.tracks.isSuccess).toBe(true)
    })
    expect(result.current.album.isSuccess).toBe(true)
    expect(deezerMock.mock.calls.filter(([path]) => path === 'album/301663')).toHaveLength(1)
  })

  it('useAlbumTracks stays idle without an id', () => {
    renderWithClient(() => useAlbumTracks(undefined, 1))
    expect(deezerMock).not.toHaveBeenCalled()
  })
})

describe('playlist hooks', () => {
  it('usePlaylist requests playlist/{id} and maps the playlist', async () => {
    respondByPath({ 'playlist/908622995': playlist })
    const { result } = renderWithClient(() => usePlaylist('908622995'))
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(deezerMock).toHaveBeenCalledWith('playlist/908622995')
    expect(result.current.data).toEqual(toPlaylist(playlist))
  })

  it('usePlaylistTracks requests playlist/{id}/tracks and returns playlist items without nulls', async () => {
    respondByPath({
      'playlist/908622995/tracks': { ...playlistTracks, data: [null, ...playlistTracks.data] },
    })
    const { result } = renderWithClient(() => usePlaylistTracks('908622995', true, 2, 50))
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(deezerMock).toHaveBeenCalledWith('playlist/908622995/tracks', { index: 50, limit: 50 })
    expect(result.current.data?.items).toEqual(
      playlistTracks.data.map((t) => toTrack(t))
    )
    expect(result.current.data?.offset).toBe(50)
    expect(result.current.data?.limit).toBe(50)
  })

  it('usePlaylistTracks stays idle when disabled or without an id', () => {
    renderWithClient(() => usePlaylistTracks('908622995', false))
    renderWithClient(() => usePlaylistTracks(''))
    expect(deezerMock).not.toHaveBeenCalled()
  })
})
