import { useQuery } from '@tanstack/react-query'

interface WikiResult {
  extract: string
  url: string
}

interface WikiSummary {
  extract?: string
  content_urls?: { desktop?: { page?: string } }
}

async function fetchWikipediaSummary(title: string): Promise<WikiResult | null> {
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  )
  if (!res.ok) return null
  const data: WikiSummary = await res.json()
  if (!data.extract) return null
  const extract = data.extract.length > 400
    ? data.extract.slice(0, 400) + '...'
    : data.extract
  return {
    extract,
    url: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
  }
}

export function useTrackWikipedia(trackName: string | undefined, artistName: string | undefined) {
  return useQuery<WikiResult | null>({
    queryKey: ['track-wikipedia', trackName, artistName],
    enabled: !!trackName && !!artistName,
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      if (!trackName || !artistName) return null
      const query = `${trackName} ${artistName} song`
      const searchRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&format=json&origin=*`
      )
      const [, titles] = await searchRes.json() as [string, string[], string[], string[]]
      const match = titles.find(t =>
        t.toLowerCase().includes(trackName.toLowerCase())
      )
      if (!match) return null
      return fetchWikipediaSummary(match)
    },
  })
}
