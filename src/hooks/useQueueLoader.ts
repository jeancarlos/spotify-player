import { useCallback } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import type { PagingObject, Track } from '@/types/music'

const WAIT_MS = 3000

export function useQueueLoader(query: UseQueryResult<PagingObject<Track>>) {
  const { data, isError, refetch } = query
  return useCallback(async (): Promise<Track[] | undefined> => {
    if (data) return data.items
    if (isError) return undefined
    const timeout = new Promise<undefined>((resolve) => setTimeout(resolve, WAIT_MS))
    return Promise.race([refetch({ cancelRefetch: false }).then((r) => r.data?.items), timeout])
  }, [data, isError, refetch])
}
