import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import api from '@/lib/axios'
import type { PagingObject } from '@/types/spotify'

// Layout da grade: r1(7) + r2(7) + r3(6) = 20 cards de dados.
// O 21º slot visual é o card "próxima página" — não entra no PAGE_SIZE.
const CHUNK = 7
const CHUNK_LAST = 6
export const PAGE_SIZE = CHUNK * 2 + CHUNK_LAST // 20

export interface CachedPage<T> extends PagingObject<T> {
  r4?: T[]
}

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
  const queryClient = useQueryClient()

  const getPageRef = useRef(getPage)
  useEffect(() => {
    getPageRef.current = getPage
  }, [getPage])

  const result = useQuery<CachedPage<T>>({
    queryKey: [queryKeyPrefix, query, page],
    enabled: query.trim().length > 0,
    queryFn: async () => {
      const base = (page - 1) * PAGE_SIZE
      const prevData = queryClient.getQueryData<CachedPage<T>>([queryKeyPrefix, query, page - 1])
      const preloadedR1 = prevData?.r4

      const fetch = async (offset: number, limit = CHUNK) =>
        api.get<R>('/search', { params: { q: query, type: apiType, limit, offset } })

      const [maybeR1, res2, r3, r4] = await Promise.all([
        preloadedR1 ? null : fetch(base),
        fetch(base + CHUNK),
        fetch(base + CHUNK * 2, CHUNK_LAST),
        fetch(base + PAGE_SIZE), // próxima página começa exatamente em base + 20
      ])

      const gp = getPageRef.current
      const r1Items = preloadedR1 ?? (maybeR1 ? gp(maybeR1.data).items : [])

      return {
        ...gp(res2.data),
        offset: base,
        items: [...r1Items, ...gp(res2.data).items, ...gp(r3.data).items],
        r4: gp(r4.data).items,
        limit: PAGE_SIZE,
      }
    },
  })

  const r4Items = result.data?.r4

  useEffect(() => {
    if (!r4Items?.length || !query.trim()) return

    const nextPage = page + 1
    const nextBase = (nextPage - 1) * PAGE_SIZE
    const gp = getPageRef.current

    const fetchNext = async (offset: number, limit = CHUNK) =>
      api.get<R>('/search', { params: { q: query, type: apiType, limit, offset } })

    void queryClient.prefetchQuery({
      queryKey: [queryKeyPrefix, query, nextPage],
      staleTime: 60_000,
      queryFn: async () => {
        const [res2, r3, r4] = await Promise.all([
          fetchNext(nextBase + CHUNK),
          fetchNext(nextBase + CHUNK * 2, CHUNK_LAST),
          fetchNext(nextBase + PAGE_SIZE),
        ])

        return {
          ...gp(res2.data),
          offset: nextBase,
          items: [...r4Items, ...gp(res2.data).items, ...gp(r3.data).items],
          r4: gp(r4.data).items,
          limit: PAGE_SIZE,
        }
      },
    })
  }, [r4Items, query, page, apiType, queryKeyPrefix, queryClient])

  return result
}
