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
  async function renderChart<T>(hook: () => { isSuccess: boolean; data?: T }, fixture: unknown) {
    deezerMock.mockResolvedValue(fixture)
    const { result } = renderWithClient(hook)
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    return result.current.data
  }

  it('useChartArtists requests chart/0/artists with limit 20 and maps a single page', async () => {
    const data = await renderChart(() => useChartArtists(), chartArtists)
    expect(deezerMock).toHaveBeenCalledWith('chart/0/artists', { limit: 20 })
    expect(data?.items).toEqual(chartArtists.data.map((a) => toArtist(a)))
    expect(data?.offset).toBe(0)
    expect(data?.total).toBe(chartArtists.data.length)
  })

  it('useChartAlbums requests chart/0/albums and maps albums', async () => {
    const data = await renderChart(() => useChartAlbums(), chartAlbums)
    expect(deezerMock).toHaveBeenCalledWith('chart/0/albums', { limit: 20 })
    expect(data?.items).toEqual(chartAlbums.data.map((a) => toAlbum(a)))
  })

  it('useChartPlaylists requests chart/0/playlists and maps playlists', async () => {
    const data = await renderChart(() => useChartPlaylists(), chartPlaylists)
    expect(deezerMock).toHaveBeenCalledWith('chart/0/playlists', { limit: 20 })
    expect(data?.items).toEqual(chartPlaylists.data.map((p) => toPlaylist(p)))
  })

  it('stays idle when disabled', () => {
    renderWithClient(() => useChartArtists(false))
    expect(deezerMock).not.toHaveBeenCalled()
  })
})
