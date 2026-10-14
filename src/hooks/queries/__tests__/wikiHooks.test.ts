import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { findWikiSummary } from '@/lib/wikipedia'
import { useArtistBio } from '../useArtistBio'
import { useTrackWikipedia } from '../useTrackWikipedia'

const lang = vi.hoisted(() => ({ value: 'en' }))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: lang.value } }),
}))
vi.mock('@/lib/wikipedia', () => ({ findWikiSummary: vi.fn() }))

const wikiMock = vi.mocked(findWikiSummary)
const summary = { title: 'T', extract: 'E', url: 'u', lang: 'en' } as unknown as Awaited<
  ReturnType<typeof findWikiSummary>
>

function renderWithClient<T>(hook: () => T) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return renderHook(hook, {
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children),
  })
}

const language = (lng: string) => {
  lang.value = lng
}

beforeEach(() => {
  wikiMock.mockReset()
  wikiMock.mockResolvedValue(summary)
  language('en')
})

describe('useArtistBio', () => {
  it('looks up the artist in English', async () => {
    const { result } = renderWithClient(() => useArtistBio('Queen'))
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(wikiMock).toHaveBeenCalledWith({
      query: 'Queen',
      match: 'Queen',
      truncate: 500,
      preferPt: false,
    })
  })

  it('prefers Portuguese for pt-BR', async () => {
    language('pt-BR')
    const { result } = renderWithClient(() => useArtistBio('Queen'))
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(wikiMock).toHaveBeenCalledWith(expect.objectContaining({ preferPt: true }))
  })

  it('stays idle without a name and resolves null when forced', async () => {
    const { result } = renderWithClient(() => useArtistBio(undefined))
    expect(wikiMock).not.toHaveBeenCalled()
    const refetched = await result.current.refetch()
    expect(refetched.data).toBeNull()
    expect(wikiMock).not.toHaveBeenCalled()
  })
})

describe('useTrackWikipedia', () => {
  it('looks up the song in English', async () => {
    const { result } = renderWithClient(() => useTrackWikipedia('Bohemian', 'Queen'))
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(wikiMock).toHaveBeenCalledWith({
      query: 'Bohemian Queen song',
      match: 'Bohemian',
      truncate: 400,
      preferPt: false,
      safe: true,
    })
  })

  it('prefers Portuguese for pt languages', async () => {
    language('pt-PT')
    const { result } = renderWithClient(() => useTrackWikipedia('Bohemian', 'Queen'))
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(wikiMock).toHaveBeenCalledWith(expect.objectContaining({ preferPt: true }))
  })

  it('stays idle without names and resolves null when forced', async () => {
    const { result } = renderWithClient(() => useTrackWikipedia(undefined, 'Queen'))
    expect(wikiMock).not.toHaveBeenCalled()
    const refetched = await result.current.refetch()
    expect(refetched.data).toBeNull()
    expect(wikiMock).not.toHaveBeenCalled()
  })
})
