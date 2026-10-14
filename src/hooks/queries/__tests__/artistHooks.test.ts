import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { deezer, DeezerError } from '@/lib/deezer'
import { toAlbum, toArtist, toTrack } from '@/lib/deezerMappers'
import { useArtist } from '../useArtist'
import { useArtistTopTracks } from '../useArtistTopTracks'
import { useArtistAlbums } from '../useArtistAlbums'
import artist from '@/mocks/fixtures/deezer/artist.json'
import artistTop from '@/mocks/fixtures/deezer/artist-top.json'
import artistAlbums from '@/mocks/fixtures/deezer/artist-albums.json'

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

describe('artist hooks', () => {
  it('useArtist requests artist/{id} and maps the artist', async () => {
    deezerMock.mockResolvedValue(artist)
    const { result } = renderWithClient(() => useArtist('892'))
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(deezerMock).toHaveBeenCalledWith('artist/892')
    expect(result.current.data).toEqual(toArtist(artist))
    expect(result.current.data?.followers?.total).toBe(artist.nb_fan)
  })

  it('useArtist stays idle without an id', () => {
    renderWithClient(() => useArtist(undefined))
    expect(deezerMock).not.toHaveBeenCalled()
  })

  it('useArtistTopTracks requests artist/{id}/top with limit and keeps the real rank', async () => {
    deezerMock.mockResolvedValue(artistTop)
    const { result } = renderWithClient(() => useArtistTopTracks('892', 10))
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(deezerMock).toHaveBeenCalledWith('artist/892/top', { limit: 10 })
    expect(result.current.data).toEqual(artistTop.data.map((t) => toTrack(t)))
    expect(result.current.data?.map((t) => t.rank)).toEqual(artistTop.data.map((t) => t.rank))
    expect(result.current.data?.length).toBeGreaterThan(0)
    expect(result.current.data?.every((t) => typeof t.rank === 'number')).toBe(true)
  })

  it('useArtistTopTracks surfaces Deezer errors instead of returning an empty list', async () => {
    deezerMock.mockRejectedValue(new DeezerError(800, 'no data'))
    const { result } = renderWithClient(() => useArtistTopTracks('0'))
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.error).toMatchObject({ code: 800 })
  })

  it('useArtistAlbums requests artist/{id}/albums with index and limit and pages the result', async () => {
    deezerMock.mockResolvedValue(artistAlbums)
    const { result } = renderWithClient(() => useArtistAlbums('892', 3, 10))
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(deezerMock).toHaveBeenCalledWith('artist/892/albums', { index: 20, limit: 10 })
    expect(result.current.data?.items).toEqual(artistAlbums.data.map((a) => toAlbum(a)))
    expect(result.current.data?.offset).toBe(20)
    expect(result.current.data?.limit).toBe(10)
    expect(result.current.data?.total).toBe(artistAlbums.total)
  })

  it('useArtistAlbums caches each limit separately', async () => {
    deezerMock.mockResolvedValue(artistAlbums)
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children)
    const { result, rerender } = renderHook(({ limit }) => useArtistAlbums('892', 1, limit), {
      wrapper,
      initialProps: { limit: 10 },
    })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    rerender({ limit: 20 })
    await waitFor(() => {
      expect(deezerMock).toHaveBeenCalledTimes(2)
    })
    expect(deezerMock).toHaveBeenLastCalledWith('artist/892/albums', { index: 0, limit: 20 })
  })
})
