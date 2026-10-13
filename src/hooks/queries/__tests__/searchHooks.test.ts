import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { deezer } from '@/lib/deezer'
import { toAlbum, toArtist, toPlaylist, toTrack } from '@/lib/deezerMappers'
import { useArtists } from '../useArtists'
import { useSearchAlbums } from '../useSearchAlbums'
import { useSearchPlaylists } from '../useSearchPlaylists'
import { useSearchTracks } from '../useSearchTracks'
import searchArtist from '@/mocks/fixtures/deezer/search-artist.json'
import searchAlbum from '@/mocks/fixtures/deezer/search-album.json'
import searchPlaylist from '@/mocks/fixtures/deezer/search-playlist.json'
import searchTrack from '@/mocks/fixtures/deezer/search-track.json'

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
})

describe('search hooks', () => {
  it('useArtists requests search/artist with q, index and limit and maps a page', async () => {
    deezerMock.mockResolvedValue(searchArtist)
    const { result } = renderWithClient(() => useArtists('coldplay', 2))
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(deezerMock).toHaveBeenCalledTimes(1)
    expect(deezerMock).toHaveBeenCalledWith('search/artist', {
      q: 'coldplay',
      index: 20,
      limit: 20,
    })
    expect(result.current.data).toEqual({
      href: '',
      items: searchArtist.data.map((a) => toArtist(a)),
      limit: 20,
      offset: 20,
      total: searchArtist.total,
      next: searchArtist.next,
      previous: null,
    })
    expect(result.current.data?.items[0]?.uri).toBe(
      `deezer:artist:${String(searchArtist.data[0]?.id)}`
    )
  })

  it('useSearchAlbums requests search/album and maps albums', async () => {
    deezerMock.mockResolvedValue(searchAlbum)
    const { result } = renderWithClient(() => useSearchAlbums('parachutes', 1))
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(deezerMock).toHaveBeenCalledWith('search/album', {
      q: 'parachutes',
      index: 0,
      limit: 20,
    })
    expect(result.current.data?.items).toEqual(searchAlbum.data.map((a) => toAlbum(a)))
    expect(result.current.data?.offset).toBe(0)
  })

  it('useSearchPlaylists drops null items', async () => {
    deezerMock.mockResolvedValue({ ...searchPlaylist, data: [null, ...searchPlaylist.data, null] })
    const { result } = renderWithClient(() => useSearchPlaylists('workout', 1))
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(deezerMock).toHaveBeenCalledWith('search/playlist', {
      q: 'workout',
      index: 0,
      limit: 20,
    })
    expect(result.current.data?.items).toEqual(searchPlaylist.data.map((p) => toPlaylist(p)))
  })

  it('does not request anything for a blank query', () => {
    const { result } = renderWithClient(() => useArtists('   ', 1))
    expect(result.current.fetchStatus).toBe('idle')
    expect(deezerMock).not.toHaveBeenCalled()
  })

  it('keeps pages apart in the cache', async () => {
    deezerMock.mockResolvedValue(searchArtist)
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children)
    const { result, rerender } = renderHook(({ page }) => useArtists('coldplay', page), {
      wrapper,
      initialProps: { page: 1 },
    })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    rerender({ page: 2 })
    await waitFor(() => {
      expect(deezerMock).toHaveBeenCalledTimes(2)
    })
    expect(deezerMock).toHaveBeenLastCalledWith('search/artist', {
      q: 'coldplay',
      index: 20,
      limit: 20,
    })
  })

  it('useSearchTracks requests search with q and limit 5 and returns mapped tracks', async () => {
    deezerMock.mockResolvedValue(searchTrack)
    const { result } = renderWithClient(() => useSearchTracks('fix you'))
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(deezerMock).toHaveBeenCalledWith('search', { q: 'fix you', limit: 5 })
    expect(result.current.data).toEqual(searchTrack.data.map((t) => toTrack(t)))
  })

  it('useSearchTracks stays idle when disabled', () => {
    renderWithClient(() => useSearchTracks('fix you', false))
    expect(deezerMock).not.toHaveBeenCalled()
  })
})
