import { useQuery } from '@tanstack/react-query'
import { TIME_30_MINUTES } from '@/utils/constants'
import api from '@/lib/axios'
import type { PagingObject } from '@/types/spotify'

// Spotify dev quota rejects limit > 10. Two parallel calls of 10 give 20 results per page.
const CHUNK_SIZE = 10
export const PAGE_SIZE = CHUNK_SIZE * 2

interface UseSearchPagedOptions<T, R> {
  queryKeyPrefix: string
  query: string
  page: number
  apiType: string
  getPage: (res: R) => PagingObject<T>
}

export function useSearchPaged<T, R>({
  queryKeyPrefix,
  query,
  page,
  apiType,
  getPage,
}: UseSearchPagedOptions<T, R>) {
  return useQuery<PagingObject<T>>({
    queryKey: [queryKeyPrefix, query, page],
    enabled: query.trim().length > 0,
    staleTime: TIME_30_MINUTES,
    queryFn: async () => {
      const baseOffset = (page - 1) * PAGE_SIZE
      const [first, second] = await Promise.all([
        api.get<R>('/search', {
          params: { q: query, type: apiType, limit: CHUNK_SIZE, offset: baseOffset },
        }),
        api.get<R>('/search', {
          params: { q: query, type: apiType, limit: CHUNK_SIZE, offset: baseOffset + CHUNK_SIZE },
        }),
      ])
      const p1 = getPage(first.data)
      const p2 = getPage(second.data)
      return { ...p1, items: [...p1.items, ...p2.items], limit: PAGE_SIZE }
    },
  })
}
