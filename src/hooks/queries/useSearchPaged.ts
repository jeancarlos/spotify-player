import { useQuery } from '@tanstack/react-query'
import { TIME_30_MINUTES } from '@/utils/constants'
import { deezer } from '@/lib/deezer'
import { toPage, type DzList } from '@/lib/deezerMappers'
import type { PagingObject } from '@/types/spotify'

export const PAGE_SIZE = 20

interface UseSearchPagedOptions<R, T> {
  queryKeyPrefix: string
  path: string
  query: string
  page: number
  map: (raw: R) => T
}

export function useSearchPaged<R, T>({
  queryKeyPrefix,
  path,
  query,
  page,
  map,
}: UseSearchPagedOptions<R, T>) {
  const index = (page - 1) * PAGE_SIZE
  return useQuery<PagingObject<T>>({
    queryKey: [queryKeyPrefix, query, index, PAGE_SIZE],
    enabled: query.trim().length > 0,
    staleTime: TIME_30_MINUTES,
    queryFn: async () => {
      const list = await deezer<DzList<R | null>>(path, { q: query, index, limit: PAGE_SIZE })
      const data = list.data.filter((raw): raw is R => raw != null)
      return toPage({ ...list, data }, index, PAGE_SIZE, map)
    },
  })
}
