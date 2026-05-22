import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { ArtistTopTracksResponse, SpotifyTrack } from '@/types/spotify'

export function useArtistTopTracks(artistId: string | undefined) {
  return useQuery<SpotifyTrack[]>({
    queryKey: ['artist-top-tracks', artistId],
    enabled: !!artistId,
    queryFn: async () => {
      const { data } = await api.get<ArtistTopTracksResponse>(
        `/artists/${artistId}/top-tracks`,
        { params: { market: 'BR' } }
      )
      return data.tracks
    },
  })
}
