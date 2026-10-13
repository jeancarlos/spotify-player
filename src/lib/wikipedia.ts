export type WikiLang = 'pt' | 'en'

export interface WikiResult {
  extract: string
  url: string
  lang: WikiLang
}

interface WikiSummary {
  extract?: string
  content_urls?: { desktop?: { page?: string } }
}

interface WikiOptions {
  query: string
  match: string
  truncate: number
  preferPt: boolean
  safe?: boolean
}

export async function fetchWikiSummary(
  lang: WikiLang,
  title: string,
  truncate: number
): Promise<WikiResult | null> {
  const base = `https://${lang}.wikipedia.org`
  const res = await fetch(`${base}/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
  if (!res.ok) return null
  const data = (await res.json()) as WikiSummary
  if (!data.extract) return null
  const extract =
    data.extract.length > truncate ? data.extract.slice(0, truncate) + '...' : data.extract
  return {
    extract,
    lang,
    url: data.content_urls?.desktop?.page ?? `${base}/wiki/${encodeURIComponent(title)}`,
  }
}

export async function searchWikiTitle(
  lang: WikiLang,
  query: string,
  match: string
): Promise<string | null> {
  const res = await fetch(
    `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&format=json&origin=*`
  )
  if (!res.ok) return null
  const [, titles] = (await res.json()) as [string, string[], string[], string[]]
  return titles.find((t) => t.toLowerCase().includes(match.toLowerCase())) ?? null
}

async function lookup(lang: WikiLang, o: WikiOptions): Promise<WikiResult | null> {
  const title = await searchWikiTitle(lang, o.query, o.match)
  return title ? fetchWikiSummary(lang, title, o.truncate) : null
}

export async function findWikiSummary(o: WikiOptions): Promise<WikiResult | null> {
  const attempt = async (lang: WikiLang) => {
    if (!o.safe) return lookup(lang, o)
    try {
      return await lookup(lang, o)
    } catch {
      return null
    }
  }
  if (o.preferPt) {
    const pt = await attempt('pt')
    if (pt) return pt
  }
  return attempt('en')
}
