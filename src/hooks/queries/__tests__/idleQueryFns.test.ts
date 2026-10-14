import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { deezer } from '@/lib/deezer'
import { useAlbum } from '../useAlbum'
import { useAlbumTracks } from '../useAlbumTracks'
import { useArtist } from '../useArtist'
import { useArtistAlbums } from '../useArtistAlbums'
import { useArtistTopTracks } from '../useArtistTopTracks'
import { usePlaylist } from '../usePlaylist'
import { usePlaylistTracks } from '../usePlaylistTracks'
import { useChartTracks } from '../useChart'
import { useLyrics } from '../useLyrics'

vi.mock('@/lib/deezer', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  deezer: vi.fn(),
}))

const deezerMock = vi.mocked(deezer)

function renderWithClient<T>(hook: () => T) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return renderHook(hook, {
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children),
  })
}

beforeEach(() => {
  deezerMock.mockReset()
  deezerMock.mockResolvedValue({ id: 1, title: 'x', name: 'x', data: [] })
})

describe('forced fetch without an id', () => {
  it.each<[string, () => { refetch: () => Promise<unknown> }, string]>([
    ['useAlbum', () => useAlbum(undefined), 'album/'],
    ['useArtist', () => useArtist(undefined), 'artist/'],
    ['usePlaylist', () => usePlaylist(undefined), 'playlist/'],
    ['useArtistAlbums', () => useArtistAlbums(undefined, 1), 'artist//albums'],
    ['useArtistTopTracks', () => useArtistTopTracks(undefined), 'artist//top'],
    ['useAlbumTracks', () => useAlbumTracks(undefined, 1), 'album//tracks'],
  ])('%s falls back to an empty id', async (_name, hook, path) => {
    const { result } = renderWithClient(hook)
    await result.current.refetch()
    expect(deezerMock.mock.calls.some(([p]) => p === path)).toBe(true)
  })
})

describe('background fetches', () => {
  it('useAlbumTracks passes the queue timeout and disables retry', async () => {
    const { result } = renderWithClient(() => useAlbumTracks('1', 1, 20, true))
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    const call = deezerMock.mock.calls.find(([p]) => p === 'album/1/tracks')
    expect(call?.[2]).toEqual(expect.any(Number))
  })

  it('usePlaylistTracks passes the queue timeout and drops null tracks', async () => {
    deezerMock.mockResolvedValue({ data: [null, { id: 1, title: 't', duration: 1 }] })
    const { result } = renderWithClient(() => usePlaylistTracks('9', true, 1, 20, true))
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data?.items).toHaveLength(1)
    expect(deezerMock.mock.calls[0][2]).toEqual(expect.any(Number))
  })

  it('usePlaylistTracks stays idle for an empty id or when disabled', () => {
    renderWithClient(() => usePlaylistTracks('', true))
    renderWithClient(() => usePlaylistTracks('9', false))
    expect(deezerMock).not.toHaveBeenCalled()
  })
})

describe('useChartTracks', () => {
  it('requests chart/0/tracks', async () => {
    deezerMock.mockResolvedValue({ data: [{ id: 1, title: 't', duration: 1 }] })
    const { result } = renderWithClient(() => useChartTracks())
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(deezerMock).toHaveBeenCalledWith('chart/0/tracks', { limit: 20 })
    expect(result.current.data?.items[0].name).toBe('t')
  })
})

describe('useLyrics', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches lyrics through the query', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ syncedLyrics: '[00:01.00]hi' }),
      })
    )
    const { result } = renderWithClient(() =>
      useLyrics({ artist: 'A', title: 'T', album: 'Al', durationMs: 1000 })
    )
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data).toEqual(['hi'])
  })

  it('stays idle without artist or title', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderWithClient(() => useLyrics({ artist: '', title: 'T', album: 'Al', durationMs: 1000 }))
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
