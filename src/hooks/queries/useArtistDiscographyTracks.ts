import { useQueries, useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { SpotifyTrack, SpotifyAlbumSimple, SpotifyAlbumTrack, PagingObject } from '@/types/spotify'

function seededFraction(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  return (Math.abs(h) % 1000) / 1000
}

function fakePopularity(trackId: string): number {
  return Math.round(15 + seededFraction(trackId) * 70)
}

function enrichTrack(track: SpotifyAlbumTrack, album: SpotifyAlbumSimple): SpotifyTrack {
  return {
    ...track,
    type: 'track',
    album: {
      id: album.id,
      name: album.name,
      images: album.images,
      release_date: album.release_date,
      album_type: album.album_type,
      artists: album.artists,
      uri: album.uri,
      type: 'album',
    },
    popularity: fakePopularity(track.id),
  }
}

export function useArtistDiscographyTracks(artistId: string | undefined, topN = 10) {
  const albums = useQuery<PagingObject<SpotifyAlbumSimple>>({
    queryKey: ['artist-albums-disc', artistId],
    enabled: !!artistId,
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data } = await api.get<PagingObject<SpotifyAlbumSimple>>(
        `/artists/${artistId}/albums`,
        { params: { limit: 5, offset: 0, include_groups: 'album,single', market: 'BR' } }
      )
      return data
    },
  })

  const albumList = albums.data?.items ?? []

  const trackQueries = useQueries({
    queries: albumList.map((album) => ({
      queryKey: ['album-tracks-disc', album.id],
      enabled: !!album.id,
      staleTime: 1000 * 60 * 10,
      queryFn: async (): Promise<SpotifyTrack[]> => {
        const { data } = await api.get<PagingObject<SpotifyAlbumTrack>>(
          `/albums/${album.id}/tracks`,
          { params: { limit: 10, offset: 0, market: 'BR' } }
        )
        return data.items.map((t) => enrichTrack(t, album))
      },
    })),
  })

  const isLoading = albums.isLoading || trackQueries.some((q) => q.isLoading)

  const data: SpotifyTrack[] = (() => {
    if (!trackQueries.length) return []
    const all = trackQueries.flatMap((q) => q.data ?? [])
    const unique = Array.from(new Map(all.map((t) => [t.id, t])).values())
    return unique.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)).slice(0, topN)
  })()

  return { data, isLoading }
}
