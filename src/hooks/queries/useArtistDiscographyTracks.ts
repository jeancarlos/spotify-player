import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import api from '@/lib/axios'
import { useArtistAlbums } from './useArtistAlbums'
import type {
  SpotifyTrack,
  SpotifyAlbumSimple,
  SpotifyAlbumTrack,
  PagingObject,
} from '@/types/spotify'

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

export function useArtistDiscographyTracks(
  artistId: string | undefined,
  topN = 10,
  externalAlbums?: SpotifyAlbumSimple[]
) {
  const internalAlbums = useArtistAlbums(artistId, 1, 10)

  const albumList = useMemo(() => {
    if (externalAlbums && externalAlbums.length > 0) return externalAlbums.slice(0, 3)
    return internalAlbums.data?.items.slice(0, 3) ?? []
  }, [externalAlbums, internalAlbums.data?.items])

  const trackQueriesResults = useQueries({
    queries: albumList.map((album) => ({
      queryKey: ['album-tracks', album.id, 1, 20] as [string, string, number, number],
      enabled: !!album.id,
      staleTime: 1000 * 60 * 60,
      queryFn: async (): Promise<PagingObject<SpotifyAlbumTrack>> => {
        const { data: res } = await api.get<PagingObject<SpotifyAlbumTrack>>(
          `/albums/${album.id}/tracks`,
          { params: { limit: 20, offset: 0, market: 'BR' } }
        )
        return res
      },
      select: (data: PagingObject<SpotifyAlbumTrack>) => data.items.map((t) => enrichTrack(t, album)),
    })),
  })

  const isLoading =
    ((!externalAlbums || externalAlbums.length === 0) && internalAlbums.isLoading) ||
    trackQueriesResults.some((q) => q.isLoading)

  const data = useMemo(() => {
    if (!trackQueriesResults.length) return []
    const all = trackQueriesResults.flatMap((q) => q.data ?? [])
    if (all.length === 0) return []
    const unique = Array.from(new Map(all.map((t) => [t.id, t])).values())
    return unique.sort((a, b) => b.popularity - a.popularity).slice(0, topN)
  }, [trackQueriesResults, topN])

  const result = useMemo(() => ({ data, isLoading }), [data, isLoading])

  return result
}

