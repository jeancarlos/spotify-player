import { useQuery } from '@tanstack/react-query'

export function parseLyrics(text: string): string[] {
  return text.split('\n').map(l => l.trim()).filter(Boolean)
}

export function useLyrics(artist: string, title: string) {
  return useQuery<string[]>({
    queryKey: ['lyrics', artist, title],
    enabled: !!artist && !!title,
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
      )
      if (!res.ok) return []
      const data = (await res.json()) as { lyrics?: string; error?: string }
      return parseLyrics(data.lyrics ?? '')
    },
  })
}
