import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useAlbumBackCover } from '@/hooks/queries/useAlbumBackCover'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

const MB_HIT = {
  releases: [{ id: 'mbid-123' }],
}

const CAA_HIT = {
  images: [
    { types: ['Front'], image: 'https://caa/front.jpg', thumbnails: { large: 'https://caa/front-lg.jpg' } },
    { types: ['Back'], image: 'https://caa/back.jpg', thumbnails: { large: 'https://caa/back-lg.jpg' } },
  ],
}

const CAA_NO_BACK = {
  images: [
    { types: ['Front'], image: 'https://caa/front.jpg', thumbnails: {} },
  ],
}

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useAlbumBackCover', () => {
  it('retorna null imediatamente quando albumId é undefined', () => {
    const { result } = renderHook(
      () => useAlbumBackCover(undefined, 'Album', 'Artista'),
      { wrapper: createWrapper() }
    )
    expect(result.current.backUrl).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('retorna backUrl quando MusicBrainz e CAA respondem com back cover', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => MB_HIT } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => CAA_HIT } as Response)

    const { result } = renderHook(
      () => useAlbumBackCover('alb-1', 'Abbey Road', 'The Beatles'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.backUrl).toBe('https://caa/back-lg.jpg')
  })

  it('retorna null quando CAA não tem imagem do tipo Back', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => MB_HIT } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => CAA_NO_BACK } as Response)

    const { result } = renderHook(
      () => useAlbumBackCover('alb-2', 'Album', 'Artista'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.backUrl).toBeNull()
  })

  it('retorna null quando MusicBrainz não retorna releases', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ releases: [] }) } as Response)

    const { result } = renderHook(
      () => useAlbumBackCover('alb-3', 'Desconhecido', 'Artista'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.backUrl).toBeNull()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('usa cache do localStorage e não refaz fetch', async () => {
    localStorage.setItem('caa:alb-cached', 'https://caa/cached-back.jpg')

    const { result } = renderHook(
      () => useAlbumBackCover('alb-cached', 'Album', 'Artista'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.backUrl).toBe('https://caa/cached-back.jpg')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('usa cache null do localStorage e não refaz fetch', async () => {
    localStorage.setItem('caa:alb-null', 'null')

    const { result } = renderHook(
      () => useAlbumBackCover('alb-null', 'Album', 'Artista'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.backUrl).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('retorna null sem cachear quando fetch lança erro de rede', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network Error'))

    const { result } = renderHook(
      () => useAlbumBackCover('alb-err', 'Album', 'Artista'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.backUrl).toBeNull()
    expect(localStorage.getItem('caa:alb-err')).toBeNull()
  })
})
