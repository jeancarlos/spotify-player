import { useQuery } from '@tanstack/react-query'
import { deezer } from '@/lib/deezer'
import { toTrack, type DzList, type DzTrack } from '@/lib/deezerMappers'
import type { SpotifyTrack } from '@/types/spotify'

const SUGGESTION_LIMIT = 5

export function useSearchTracks(query: string, enabled = true) {
  return useQuery<SpotifyTrack[]>({
    queryKey: ['search-tracks', query, SUGGESTION_LIMIT],
    enabled: enabled && query.trim().length > 0,
    queryFn: async () => {
      const list = await deezer<DzList<DzTrack>>('search', { q: query, limit: SUGGESTION_LIMIT })
      return list.data.map((t) => toTrack(t))
    },
  })
}
