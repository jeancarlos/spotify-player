import { useQuery } from '@tanstack/react-query'
import type { LyricLine } from '@/types/lyrics'
import { parseLRC, parsePlainLyrics } from '@/utils/lrcParser'

export function cleanTitle(title: string): string {
  return title
    .replace(/ - From .*/i, '')
    .replace(/ \(feat\..*?\)/gi, '')
    .replace(/ \(with .*?\)/gi, '')
    .replace(/ - Remastered.*/i, '')
    .trim()
}

export interface FetchLyricsParams {
  artist: string
  title: string
  album?: string
  durationMs?: number
}

export async function fetchLyrics({
  artist,
  title,
  album,
  durationMs,
}: FetchLyricsParams): Promise<LyricLine[]> {
  const cleanedTitle = cleanTitle(title)
  const url = new URL('https://lrclib.net/api/get')
  url.searchParams.set('artist_name', artist)
  url.searchParams.set('track_name', cleanedTitle)
  if (album) url.searchParams.set('album_name', album)
  if (durationMs) url.searchParams.set('duration', Math.round(durationMs / 1000).toString())

  try {
    const res = await fetch(url.toString())
    if (!res.ok) return []

    const data = (await res.json()) as {
      syncedLyrics?: string
      plainLyrics?: string
      error?: string
    }

    if (data.syncedLyrics) {
      return parseLRC(data.syncedLyrics)
    }

    if (data.plainLyrics && durationMs) {
      return parsePlainLyrics(data.plainLyrics, durationMs)
    }

    return []
  } catch (error) {
    console.error('Error fetching lyrics:', error)
    return []
  }
}

export type UseLyricsParams = FetchLyricsParams

export function useLyrics(params: UseLyricsParams) {
  const cleanedTitle = cleanTitle(params.title)

  return useQuery<LyricLine[]>({
    queryKey: ['lyrics', params.artist, cleanedTitle, params.durationMs],
    enabled: !!params.artist && !!params.title,
    retry: false,
    staleTime: Infinity,
    queryFn: () => fetchLyrics(params),
  })
}
