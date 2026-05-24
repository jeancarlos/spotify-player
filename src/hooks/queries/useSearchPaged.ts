import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { PagingObject } from '@/types/spotify'

export const PAGE_SIZE = 20

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
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data } = await api.get<R>('/search', {
        params: { q: query, type: apiType, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE },
      })
      return getPage(data)
    },
  })
}
