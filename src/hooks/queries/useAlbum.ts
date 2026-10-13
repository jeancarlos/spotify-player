import { queryOptions, useQuery } from '@tanstack/react-query'
import { TIME_60_MINUTES } from '@/utils/constants'
import { deezer } from '@/lib/deezer'
import { toAlbum, type DzAlbum } from '@/lib/deezerMappers'

export function albumQuery(albumId: string | undefined) {
  return queryOptions({
    queryKey: ['album', albumId],
    staleTime: TIME_60_MINUTES,
    queryFn: async () => toAlbum(await deezer<DzAlbum>(`album/${albumId ?? ''}`)),
  })
}

export function useAlbum(albumId: string | undefined) {
  return useQuery({ ...albumQuery(albumId), enabled: !!albumId })
}
