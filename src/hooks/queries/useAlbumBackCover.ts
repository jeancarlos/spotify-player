import { useQuery } from '@tanstack/react-query'

interface MBUrlResult {
  relations: Array<{ release?: { id: string } }>
}

interface MBSearchResult {
  releases: Array<{ id: string }>
}

interface CAAImage {
  types: string[]
  image: string
  thumbnails: { large?: string; '500'?: string }
}

interface CAAResponse {
  images: CAAImage[]
}

const MB_HEADERS = { 'User-Agent': 'SpotifyPlayer/1.0 (jeancosouza@gmail.com)' }

async function fetchMbid(albumId: string, albumName: string, artistName: string): Promise<string | null> {
  // Estratégia 1: lookup exato pelo Spotify URL no MusicBrainz
  const urlRes = await fetch(
    `https://musicbrainz.org/ws/2/url?resource=https://open.spotify.com/album/${albumId}&inc=release-rels&fmt=json`,
    { headers: MB_HEADERS },
  )
  if (urlRes.ok) {
    const urlData: MBUrlResult = await urlRes.json()
    const mbid = urlData.relations?.find(r => r.release)?.release?.id
    if (mbid) return mbid
  }

  // Estratégia 2: busca textual por nome + artista (fallback)
  const escapeQuery = (s: string) => s.replace(/([+\-&|!(){}[\]^"~*?:\\])/g, '\\$1')
  const query = `release:"${escapeQuery(albumName)}"+artistname:"${escapeQuery(artistName)}"`
  const searchRes = await fetch(
    `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(query)}&limit=1&fmt=json`,
    { headers: MB_HEADERS },
  )
  if (!searchRes.ok) return null
  const searchData: MBSearchResult = await searchRes.json()
  return searchData.releases?.[0]?.id ?? null
}

async function fetchBackUrl(mbid: string): Promise<string | null> {
  const caaRes = await fetch(`https://coverartarchive.org/release/${mbid}`)
  if (!caaRes.ok) return null
  const caaData: CAAResponse = await caaRes.json()
  const back = caaData.images.find(img => img.types.includes('Back'))
  return back?.thumbnails?.large ?? back?.thumbnails?.['500'] ?? back?.image ?? null
}

export function useAlbumBackCover(
  albumId: string | undefined,
  albumName: string,
  artistName: string,
): { backUrl: string | null; loading: boolean } {
  const { data, isLoading } = useQuery<string | null>({
    queryKey: ['album-back-cover', albumId],
    enabled: !!albumId && !!albumName && !!artistName,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const cacheKey = `caa:${albumId}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) return cached

      try {
        const mbid = await fetchMbid(albumId!, albumName, artistName)
        if (!mbid) return null
        const url = await fetchBackUrl(mbid)
        if (url) localStorage.setItem(cacheKey, url)
        return url
      } catch {
        return null
      }
    },
  })

  return { backUrl: data ?? null, loading: isLoading }
}
