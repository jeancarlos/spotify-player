import { useQuery } from '@tanstack/react-query'

export function parseLyrics(text: string): string[] {
  return text.split('\n').map(l => l.trim()).filter(Boolean)
}

function cleanTitle(title: string): string {
  return title
    .replace(/ - From .*/i, '')
    .replace(/ \(feat\..*?\)/gi, '')
    .replace(/ \(with .*?\)/gi, '')
    .trim()
}

export function useLyrics(artist: string, title: string) {
  const cleanedTitle = cleanTitle(title)
  return useQuery<string[]>({
    queryKey: ['lyrics', artist, cleanedTitle],
    enabled: !!artist && !!cleanedTitle,
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(cleanedTitle)}`
      )
      if (!res.ok) return []
      const data = (await res.json()) as { lyrics?: string; error?: string }
      return parseLyrics(data.lyrics ?? '')
    },
  })
}
