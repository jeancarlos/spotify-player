import { useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { currentPath } from '@/utils/routerState'
import { useTranslation } from 'react-i18next'
import { useAlbum } from '@/hooks/queries/useAlbum'
import { useAlbumTracks } from '@/hooks/queries/useAlbumTracks'
import { useScopedPage } from '@/hooks/useScopedPage'
import { usePlayer } from '@/contexts/PlayerContext'
import { isPlayable } from '@/lib/deezerMappers'
import { formatDate } from '@/utils/formatDate'
import type {
  Track,
  AlbumSimple,
  AlbumFull,
  Image,
} from '@/types/music'
import type { ViewMode } from '@/components/shared/ListTableSwitch'

export const ALBUM_LIMIT = 20

const EMPTY_ALBUM_SIMPLE: AlbumSimple = {
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
  albumSimple: AlbumSimple
  albumYear: string | undefined
  albumSubtitle: string
  images: Image[]
  albumName: string
  albumArtists: AlbumSimple['artists'] | undefined
  albumLink: string | undefined
}

function deriveAlbumMeta(data: AlbumFull | undefined): AlbumMeta {
  if (!data) {
    return {
      albumSimple: EMPTY_ALBUM_SIMPLE,
      albumYear: undefined,
      albumSubtitle: '',
      images: [],
      albumName: '',
      albumArtists: undefined,
      albumLink: undefined,
    }
  }
  return {
    albumSimple: data,
    albumYear: formatDate(data.release_date, 'year'),
    albumSubtitle: data.artists.map((a) => a.name).join(', '),
    images: data.images,
    albumName: data.name,
    albumArtists: data.artists,
    albumLink: data.link,
  }
}

export function useAlbumDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  const [page, setPage] = useScopedPage(id)
  const [view, setView] = useState<ViewMode>('list')
  const [headerHeight, setHeaderHeight] = useState(0)

  const album = useAlbum(id)
  const tracks = useAlbumTracks(id, page, ALBUM_LIMIT)
  const { state: playerState, controls } = usePlayer()

  const handleLayout = useCallback((h: number) => {
    setHeaderHeight(h)
  }, [])

  const handleArtistClick = useCallback(
    (artistId: string) => {
      navigate(`/artists/${artistId}`, { state: { from: currentPath(location) } })
    },
    [navigate, location]
  )

  const meta = useMemo(() => deriveAlbumMeta(album.data), [album.data])

  const albumItems = useMemo(() => tracks.data?.items ?? [], [tracks.data])


  const hasNext =
    tracks.data != null ? tracks.data.offset + tracks.data.limit < tracks.data.total : false


  const handleTrackPlay = useCallback(
    async (track: Track) => {
      await controls.playTrack(track, albumItems)
    },
    [controls, albumItems]
  )

  const handlePlay = useCallback(() => {
    const first = albumItems.find(isPlayable)
    if (first) void controls.playTrack(first, albumItems)
  }, [albumItems, controls])

  return {
    albumItems,
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
