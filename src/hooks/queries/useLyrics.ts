import { useQuery } from '@tanstack/react-query'

export function useLyrics(artist: string, title: string, enabled = true) {
  return useQuery<string | null>({
    queryKey: ['lyrics', artist, title],
    enabled: enabled && !!artist && !!title,
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
      )
      if (!res.ok) return null
      const data = (await res.json()) as { lyrics?: string; error?: string }
      return data.lyrics ?? null
    },
  })
}
