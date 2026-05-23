import { useQuery } from '@tanstack/react-query'
import { LyricLine } from '@/types/lyrics'
import { parseLRC, parsePlainLyrics } from '@/utils/lrcParser'

function cleanTitle(title: string): string {
  return title
    .replace(/ - From .*/i, '')
    .replace(/ \(feat\..*?\)/gi, '')
    .replace(/ \(with .*?\)/gi, '')
    .replace(/ - Remastered.*/i, '')
    .trim()
}

export interface UseLyricsParams {
  artist: string
  title: string
  album?: string
  durationMs?: number
}

export function useLyrics({ artist, title, album, durationMs }: UseLyricsParams) {
  const cleanedTitle = cleanTitle(title)
  
  return useQuery<LyricLine[]>({
    queryKey: ['lyrics', artist, cleanedTitle, durationMs],
    enabled: !!artist && !!cleanedTitle,
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      // LRCLIB API
      const url = new URL('https://lrclib.net/api/get')
      url.searchParams.set('artist_name', artist)
      url.searchParams.set('track_name', cleanedTitle)
      if (album) url.searchParams.set('album_name', album)
      if (durationMs) url.searchParams.set('duration', Math.round(durationMs / 1000).toString())

      try {
        const res = await fetch(url.toString())
        if (!res.ok) return []
        
        const data = (await res.json()) as { 
          syncedLyrics?: string; 
          plainLyrics?: string;
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
    },
  })
}
