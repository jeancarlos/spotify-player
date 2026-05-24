import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

interface WikiResult {
  extract: string
  url: string
  lang: 'pt' | 'en'
}

interface WikiSummary {
  extract?: string
  content_urls?: { desktop?: { page?: string } }
}

async function fetchWikiSummary(lang: 'pt' | 'en', title: string): Promise<WikiResult | null> {
  const base = `https://${lang}.wikipedia.org`
  const res = await fetch(`${base}/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
  if (!res.ok) return null
  const data: WikiSummary = await res.json()
  if (!data.extract) return null
  const extract = data.extract.length > 500 ? data.extract.slice(0, 500) + '...' : data.extract
  return {
    extract,
    lang,
    url: data.content_urls?.desktop?.page ?? `${base}/wiki/${encodeURIComponent(title)}`,
  }
}

async function searchWiki(lang: 'pt' | 'en', artistName: string): Promise<string | null> {
  const res = await fetch(
    `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(artistName)}&limit=3&format=json&origin=*`
  )
  if (!res.ok) return null
  const [, titles] = (await res.json()) as [string, string[], string[], string[]]
  return titles.find((t) => t.toLowerCase().includes(artistName.toLowerCase())) ?? null
}

async function fetchArtistBio(
  artistName: string,
  preferPt: boolean
): Promise<WikiResult | null> {
  if (preferPt) {
    const ptTitle = await searchWiki('pt', artistName)
    if (ptTitle) {
      const result = await fetchWikiSummary('pt', ptTitle)
      if (result) return result
    }
  }

  const enTitle = await searchWiki('en', artistName)
  if (!enTitle) return null
  return fetchWikiSummary('en', enTitle)
}

export function useArtistBio(artistName: string | undefined) {
  const { i18n } = useTranslation()
  const preferPt = i18n.language === 'pt-BR'

  return useQuery<WikiResult | null>({
    queryKey: ['artist-bio', artistName, i18n.language],
    enabled: !!artistName,
    staleTime: 1000 * 60 * 60,
    queryFn: () => (artistName ? fetchArtistBio(artistName, preferPt) : null),
  })
}
