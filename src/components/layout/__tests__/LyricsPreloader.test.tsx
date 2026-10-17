import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LyricsPreloader } from '../LyricsPreloader'
import { lyricsKey } from '@/hooks/queries/useLyrics'
import type { Track } from '@/types/music'

const mk = (n: number) =>
  ({
    name: `Song ${n}`,
    duration_ms: 1000 * n,
    artists: [{ name: `Artist ${n}` }],
    album: { name: `Album ${n}` },
  }) as unknown as Track

let state = { queue: [mk(0), mk(1), mk(2), mk(3)], queueIndex: 0 }

vi.mock('@/contexts/PlayerContext', () => ({ usePlayer: () => ({ state }) }))

describe('LyricsPreloader', () => {
  it('prefetches lyrics for the next two queue tracks only', () => {
    const queryClient = new QueryClient()
    const spy = vi.spyOn(queryClient, 'query').mockResolvedValue(null)
    render(
      <QueryClientProvider client={queryClient}>
        <LyricsPreloader />
      </QueryClientProvider>
    )
    expect(spy.mock.calls.map(([o]) => o.queryKey)).toEqual([
      ['lyrics', 'Artist 1', 'Song 1', 1000, 'Album 1'],
      ['lyrics', 'Artist 2', 'Song 2', 2000, 'Album 2'],
    ])
  })

  it('swallows prefetch failures', async () => {
    state = { queue: [mk(0), mk(1)], queueIndex: 0 }
    const queryClient = new QueryClient()
    const spy = vi.spyOn(queryClient, 'query').mockRejectedValue(new Error('x'))
    render(
      <QueryClientProvider client={queryClient}>
        <LyricsPreloader />
      </QueryClientProvider>
    )
    await expect(spy.mock.results[0].value).rejects.toThrow('x')
  })

  it('uses the same key useLyrics builds for the same track', () => {
    const queryClient = new QueryClient()
    const spy = vi.spyOn(queryClient, 'query').mockResolvedValue(null)
    render(
      <QueryClientProvider client={queryClient}>
        <LyricsPreloader />
      </QueryClientProvider>
    )
    expect(spy.mock.calls[0][0].queryKey).toEqual(
      lyricsKey({ artist: 'Artist 1', title: 'Song 1', album: 'Album 1', durationMs: 1000 })
    )
  })

  it('skips tracks without an artist or title and tracks already cached', () => {
    const noArtist = { ...mk(1), artists: [] } as unknown as Track
    const cached = mk(2)
    state = { queue: [mk(0), noArtist, cached], queueIndex: 0 }
    const queryClient = new QueryClient()
    queryClient.setQueryData(
      lyricsKey({ artist: 'Artist 2', title: 'Song 2', album: 'Album 2', durationMs: 2000 }),
      'cached'
    )
    const spy = vi.spyOn(queryClient, 'query').mockResolvedValue(null)
    render(
      <QueryClientProvider client={queryClient}>
        <LyricsPreloader />
      </QueryClientProvider>
    )
    expect(spy).not.toHaveBeenCalled()
  })

  it('runs the lyrics fetcher through the prefetch query function', async () => {
    state = { queue: [mk(0), mk(1)], queueIndex: 0 }
    const queryClient = new QueryClient()
    const spy = vi.spyOn(queryClient, 'query').mockResolvedValue(null)
    render(
      <QueryClientProvider client={queryClient}>
        <LyricsPreloader />
      </QueryClientProvider>
    )
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 404 }))
    const queryFn = (spy.mock.calls[0][0] as unknown as { queryFn: () => Promise<unknown> }).queryFn
    await expect(queryFn()).resolves.toEqual([])
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    fetchSpy.mockRestore()
  })
})
