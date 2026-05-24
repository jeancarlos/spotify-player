import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import api from '@/lib/axios'
import type { ArtistTopTracksResponse, SpotifyTrack } from '@/types/spotify'

export function useArtistTopTracks(artistId: string | undefined) {
  return useQuery<SpotifyTrack[]>({
    queryKey: ['artist-top-tracks', artistId],
    enabled: !!artistId,
    retry: false,
    queryFn: async () => {
      try {
        const { data } = await api.get<ArtistTopTracksResponse>(`/artists/${artistId}/top-tracks`, {
          params: { market: 'BR' },
        })
        return data.tracks
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 403) return []
        throw err
      }
    },
  })
}
