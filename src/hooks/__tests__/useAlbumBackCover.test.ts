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

// Respostas do MusicBrainz URL lookup (estratégia 1)
const MB_URL_HIT = {
  relations: [{ release: { id: 'mbid-from-url' } }],
}
const MB_URL_MISS = {
  relations: [],
}

// Resposta do MusicBrainz busca por nome (estratégia 2)
const MB_SEARCH_HIT = {
  releases: [{ id: 'mbid-from-search' }],
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

  it('retorna backUrl via lookup por Spotify URL (estratégia 1)', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => MB_URL_HIT } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => CAA_HIT } as Response)

    const { result } = renderHook(
      () => useAlbumBackCover('alb-1', 'Abbey Road', 'The Beatles'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.backUrl).toBe('https://caa/back-lg.jpg')
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('open.spotify.com/album/alb-1')
  })

  it('usa fallback por nome quando URL lookup não acha release', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => MB_URL_MISS } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => MB_SEARCH_HIT } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => CAA_HIT } as Response)

    const { result } = renderHook(
      () => useAlbumBackCover('alb-2', 'Abbey Road', 'The Beatles'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.backUrl).toBe('https://caa/back-lg.jpg')
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('retorna null quando CAA não tem imagem do tipo Back', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => MB_URL_HIT } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => CAA_NO_BACK } as Response)

    const { result } = renderHook(
      () => useAlbumBackCover('alb-3', 'Album', 'Artista'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.backUrl).toBeNull()
  })

  it('retorna null quando ambas as estratégias falham em achar MBID', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => MB_URL_MISS } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ releases: [] }) } as Response)

    const { result } = renderHook(
      () => useAlbumBackCover('alb-4', 'Desconhecido', 'Artista'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.backUrl).toBeNull()
    expect(fetch).toHaveBeenCalledTimes(2)
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
