import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

interface WikiResult {
  extract: string
  url: string
}

interface WikiSummary {
  extract?: string
  content_urls?: { desktop?: { page?: string } }
}

async function fetchWikipediaSummary(title: string, lang: string): Promise<WikiResult | null> {
  try {
    const res = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    )
    if (!res.ok) return null
    const data = (await res.json()) as WikiSummary
    if (!data.extract) return null
    const extract = data.extract.length > 400 ? data.extract.slice(0, 400) + '...' : data.extract
    return {
      extract,
      url:
        data.content_urls?.desktop?.page ??
        `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    }
  } catch {
    return null
  }
}

async function searchAndFetch(
  trackName: string,
  artistName: string,
  lang: string
): Promise<WikiResult | null> {
  try {
    const query = `${trackName} ${artistName} song`
    const searchRes = await fetch(
      `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&format=json&origin=*`
    )
    if (!searchRes.ok) return null

    const [, titles] = (await searchRes.json()) as [string, string[], string[], string[]]
    const match = titles.find((t) => t.toLowerCase().includes(trackName.toLowerCase()))
    if (!match) return null

    return await fetchWikipediaSummary(match, lang)
  } catch {
    return null
  }
}

export function useTrackWikipedia(trackName: string | undefined, artistName: string | undefined) {
  const { i18n } = useTranslation()
  const currentLang = i18n.language.startsWith('pt') ? 'pt' : 'en'

  return useQuery<WikiResult | null>({
    queryKey: ['track-wikipedia', trackName, artistName, currentLang],
    enabled: !!trackName && !!artistName,
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      if (!trackName || !artistName) return null

      if (currentLang === 'pt') {
        const ptResult = await searchAndFetch(trackName, artistName, 'pt')
        if (ptResult) return ptResult
      }

      return searchAndFetch(trackName, artistName, 'en')
    },
  })
}
