import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import api from '@/lib/axios'
import type { PagingObject } from '@/types/spotify'

const PAGE_SIZE = 21
const CHUNK = 7
const CHUNK_LAST = CHUNK - 1 // 6 — deixa 1 slot livre para o card "próxima página"

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

  // Ref pra não incluir getPage (inline fn) nas deps do useEffect
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
      const fetch = (offset: number, limit = CHUNK) =>
        api.get<R>('/search', { params: { q: query, type: apiType, limit, offset } })

      const [maybeR1, res2, r3, r4] = await Promise.all([
        preloadedR1 ? null : fetch(base),
        fetch(base + CHUNK),
        fetch(base + CHUNK * 2, CHUNK_LAST),
        fetch(base + CHUNK * 3),
      ])

      const gp = getPageRef.current
      const r1Items = preloadedR1 ?? gp(maybeR1!.data).items

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

    const fetchNext = (offset: number, limit = CHUNK) =>
      api.get<R>('/search', { params: { q: query, type: apiType, limit, offset } })

    queryClient.prefetchQuery({
      queryKey: [queryKeyPrefix, query, nextPage],
      staleTime: 60_000,
      queryFn: async () => {
        const [res2, r3, r4] = await Promise.all([
          fetchNext(nextBase + CHUNK),
          fetchNext(nextBase + CHUNK * 2, CHUNK_LAST),
          fetchNext(nextBase + CHUNK * 3),
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
