import { useQuery } from '@tanstack/react-query'
import { deezer } from '@/lib/deezer'
import { toTrack, type DzList, type DzTrack } from '@/lib/deezerMappers'
import type { Track } from '@/types/music'

const SUGGESTION_LIMIT = 5

export function useSearchTracks(query: string, enabled = true) {
  return useQuery<Track[]>({
    queryKey: ['search-tracks', query, SUGGESTION_LIMIT],
    meta: { source: 'deezer' },
    enabled: enabled && query.trim().length > 0,
    queryFn: async () => {
      const list = await deezer<DzList<DzTrack>>('search', { q: query, limit: SUGGESTION_LIMIT })
      return list.data.map((t) => toTrack(t))
    },
  })
}
