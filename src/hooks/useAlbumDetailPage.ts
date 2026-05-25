import { useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAlbum } from '@/hooks/queries/useAlbum'
import { useAlbumTracks } from '@/hooks/queries/useAlbumTracks'
import { usePlayContext } from '@/hooks/usePlayContext'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { usePlayer } from '@/hooks/usePlayer'
import { formatDate } from '@/utils/formatDate'
import type {
  SpotifyTrack,
  SpotifyAlbumTrack,
  SpotifyAlbumSimple,
  SpotifyAlbumFull,
} from '@/types/spotify'
import type { ViewMode } from '@/components/shared/ListTableSwitch'

export const ALBUM_LIMIT = 20

const EMPTY_ALBUM_SIMPLE: SpotifyAlbumSimple = {
  id: '',
  name: '',
  images: [],
  release_date: '',
  album_type: 'album',
  artists: [],
  uri: '',
  type: 'album',
}

interface AlbumMeta {
  albumSimple: SpotifyAlbumSimple
  albumYear: string | undefined
  albumSubtitle: string
  imageUrl: string | undefined
  albumName: string
  albumArtists: SpotifyAlbumSimple['artists'] | undefined
}

function deriveAlbumMeta(data: SpotifyAlbumFull | undefined): AlbumMeta {
  if (!data) {
    return {
      albumSimple: EMPTY_ALBUM_SIMPLE,
      albumYear: undefined,
      albumSubtitle: '',
      imageUrl: undefined,
      albumName: '',
      albumArtists: undefined,
    }
  }
  return {
    albumSimple: data,
    albumYear: formatDate(data.release_date, 'year'),
    albumSubtitle: data.artists.map((a) => a.name).join(', '),
    imageUrl: data.images[0]?.url,
    albumName: data.name,
    albumArtists: data.artists,
  }
}

export function useAlbumDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  const [page, setPage] = useState(1)
  const [view, setView] = useState<ViewMode>('list')
  const [headerHeight, setHeaderHeight] = useState(0)

  const album = useAlbum(id)
  const tracks = useAlbumTracks(id, page, ALBUM_LIMIT)
  const playContext = usePlayContext()
  const playTrack = usePlayTrack()
  const { state: playerState } = usePlayer()

  const handlePlay = useCallback(() => {
    if (album.data?.uri) void playContext(album.data.uri)
  }, [album.data, playContext])

  const handleLayout = useCallback((h: number) => {
    setHeaderHeight(h)
  }, [])

  const handleArtistClick = useCallback(
    (artistId: string) => {
      navigate(`/artists/${artistId}`, { state: { from: location.pathname } })
    },
    [navigate, location.pathname]
  )

  const meta = useMemo(() => deriveAlbumMeta(album.data), [album.data])

  const albumItems = useMemo(() => tracks.data?.items ?? [], [tracks.data])

  const enrichedTracks: SpotifyTrack[] = useMemo(
    () =>
      albumItems.map((track) => ({
        ...track,
        type: 'track' as const,
        album: meta.albumSimple,
        popularity: 0,
      })),
    [albumItems, meta.albumSimple]
  )

  const hasNext =
    tracks.data != null ? tracks.data.offset + tracks.data.limit < tracks.data.total : false

  const toPlayableTrack = useCallback(
    (track: SpotifyAlbumTrack): SpotifyTrack => ({
      ...track,
      type: 'track' as const,
      album: meta.albumSimple,
      popularity: 0,
    }),
    [meta.albumSimple]
  )

  const handleTrackPlay = useCallback(
    async (track: SpotifyTrack | SpotifyAlbumTrack) => {
      await playTrack('album' in track ? track : toPlayableTrack(track), enrichedTracks)
    },
    [playTrack, enrichedTracks, toPlayableTrack]
  )

  return {
    albumItems,
    enrichedTracks,
    handleTrackPlay,
    playerState,
    view,
    setView,
    page,
    setPage,
    headerHeight,
    hasNext,
    handlePlay,
    handleLayout,
    handleArtistClick,
    t,
    ...meta,
  }
}
