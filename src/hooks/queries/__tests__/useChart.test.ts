import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { deezer } from '@/lib/deezer'
import { toAlbum, toArtist, toPlaylist } from '@/lib/deezerMappers'
import { useChartAlbums, useChartArtists, useChartPlaylists } from '../useChart'
import chartArtists from '@/mocks/fixtures/deezer/chart-artists.json'
import chartAlbums from '@/mocks/fixtures/deezer/chart-albums.json'
import chartPlaylists from '@/mocks/fixtures/deezer/chart-playlists.json'

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

describe('chart hooks', () => {
  it('useChartArtists requests chart/0/artists with limit 20 and maps a single page', async () => {
    deezerMock.mockResolvedValue(chartArtists)
    const { result } = renderWithClient(() => useChartArtists())
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(deezerMock).toHaveBeenCalledWith('chart/0/artists', { limit: 20 })
    expect(result.current.data?.items).toEqual(chartArtists.data.map((a) => toArtist(a)))
    expect(result.current.data?.offset).toBe(0)
    expect(result.current.data?.total).toBe(chartArtists.data.length)
  })

  it('useChartAlbums requests chart/0/albums and maps albums', async () => {
    deezerMock.mockResolvedValue(chartAlbums)
    const { result } = renderWithClient(() => useChartAlbums())
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(deezerMock).toHaveBeenCalledWith('chart/0/albums', { limit: 20 })
    expect(result.current.data?.items).toEqual(chartAlbums.data.map((a) => toAlbum(a)))
  })

  it('useChartPlaylists requests chart/0/playlists and maps playlists', async () => {
    deezerMock.mockResolvedValue(chartPlaylists)
    const { result } = renderWithClient(() => useChartPlaylists())
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(deezerMock).toHaveBeenCalledWith('chart/0/playlists', { limit: 20 })
    expect(result.current.data?.items).toEqual(chartPlaylists.data.map((p) => toPlaylist(p)))
  })

  it('stays idle when disabled', () => {
    renderWithClient(() => useChartArtists(false))
    expect(deezerMock).not.toHaveBeenCalled()
  })
})
