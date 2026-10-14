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

const state = { queue: [mk(0), mk(1), mk(2), mk(3)], queueIndex: 0 }

vi.mock('@/contexts/PlayerContext', () => ({ usePlayer: () => ({ state }) }))

describe('LyricsPreloader', () => {
  it('prefetches lyrics for the next two queue tracks only', () => {
    const queryClient = new QueryClient()
    const spy = vi.spyOn(queryClient, 'prefetchQuery').mockResolvedValue(undefined)
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

  it('uses the same key useLyrics builds for the same track', () => {
    const queryClient = new QueryClient()
    const spy = vi.spyOn(queryClient, 'prefetchQuery').mockResolvedValue(undefined)
    render(
      <QueryClientProvider client={queryClient}>
        <LyricsPreloader />
      </QueryClientProvider>
    )
    expect(spy.mock.calls[0][0].queryKey).toEqual(
      lyricsKey({ artist: 'Artist 1', title: 'Song 1', album: 'Album 1', durationMs: 1000 })
    )
  })
})
