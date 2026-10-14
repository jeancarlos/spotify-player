import { useQuery } from '@tanstack/react-query'
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
}: FetchLyricsParams): Promise<string[]> {
  const cleanedTitle = cleanTitle(title)
  const url = new URL('https://lrclib.net/api/get')
  url.searchParams.set('artist_name', artist)
  url.searchParams.set('track_name', cleanedTitle)
  if (album) url.searchParams.set('album_name', album)
  if (durationMs) url.searchParams.set('duration', Math.round(durationMs / 1000).toString())

  const res = await fetch(url.toString())
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`lrclib responded ${res.status}`)

  const data = (await res.json()) as {
    syncedLyrics?: string
    plainLyrics?: string
  }

  const synced = data.syncedLyrics
    ? parseLRC(data.syncedLyrics)
        .map((l) => l.text)
        .filter(Boolean)
    : []
  if (synced.length > 0) return synced
  return data.plainLyrics ? parsePlainLyrics(data.plainLyrics) : []
}

export function lyricsKey({ artist, title, album, durationMs }: FetchLyricsParams) {
  return ['lyrics', artist, cleanTitle(title), durationMs, album] as const
}

export type UseLyricsParams = FetchLyricsParams

export function useLyrics(params: UseLyricsParams) {
  return useQuery<string[]>({
    queryKey: lyricsKey(params),
    enabled: !!params.artist && !!params.title,
    retry: false,
    staleTime: Infinity,
    queryFn: async () => fetchLyrics(params),
  })
}
