import { useQuery } from '@tanstack/react-query'
import { TIME_30_MINUTES } from '@/utils/constants'
import { deezer } from '@/lib/deezer'

// R only appears in `map`, but each caller must name its Deezer payload type
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function useDeezerEntity<R, T>(kind: string, id: string | undefined, map: (raw: R) => T) {
  return useQuery<T>({
    queryKey: [kind, id],
    meta: { source: 'deezer' },
    enabled: !!id,
    staleTime: TIME_30_MINUTES,
    queryFn: async () => map(await deezer<R>(`${kind}/${id ?? ''}`)),
  })
}
