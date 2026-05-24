import { useQuery } from '@tanstack/react-query'

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
      if (cached !== null) return cached === 'null' ? null : cached

      const escapeQuery = (s: string) => s.replace(/([+\-&|!(){}[\]^"~*?:\\])/g, '\\$1')

      try {
        const query = `release:"${escapeQuery(albumName)}"+artistname:"${escapeQuery(artistName)}"`
        const mbRes = await fetch(
          `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(query)}&limit=1&fmt=json`,
          { headers: { 'User-Agent': 'SpotifyPlayer/1.0 (jeancosouza@gmail.com)' } },
        )
        if (!mbRes.ok) {
          if (mbRes.status === 404) { localStorage.setItem(cacheKey, 'null'); return null }
          return null
        }

        const mbData: MBSearchResult = await mbRes.json()
        const mbid = mbData.releases?.[0]?.id
        if (!mbid) { localStorage.setItem(cacheKey, 'null'); return null }

        const caaRes = await fetch(`https://coverartarchive.org/release/${mbid}`)
        if (!caaRes.ok) {
          if (caaRes.status === 404) { localStorage.setItem(cacheKey, 'null'); return null }
          return null
        }

        const caaData: CAAResponse = await caaRes.json()
        const back = caaData.images.find(img => img.types.includes('Back'))
        const url = back?.thumbnails?.large ?? back?.thumbnails?.['500'] ?? back?.image ?? null

        localStorage.setItem(cacheKey, url ?? 'null')
        return url
      } catch {
        return null
      }
    },
  })

  return { backUrl: data ?? null, loading: isLoading }
}
