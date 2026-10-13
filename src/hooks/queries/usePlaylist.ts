import { useQuery } from '@tanstack/react-query'
import { TIME_30_MINUTES } from '@/utils/constants'
import { deezer } from '@/lib/deezer'
import { toPlaylist, type DzPlaylist } from '@/lib/deezerMappers'
import type { SpotifyPlaylist } from '@/types/spotify'

export function usePlaylist(playlistId: string | undefined) {
  return useQuery<SpotifyPlaylist>({
    queryKey: ['playlist', playlistId],
    enabled: !!playlistId,
    staleTime: TIME_30_MINUTES,
    queryFn: async () => toPlaylist(await deezer<DzPlaylist>(`playlist/${playlistId ?? ''}`)),
  })
}
