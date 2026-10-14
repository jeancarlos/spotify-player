import { useState, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { currentPath } from '@/utils/routerState'
import { useArtist } from '@/hooks/queries/useArtist'
import { useArtistAlbums } from '@/hooks/queries/useArtistAlbums'
import { useArtistTopTracks } from '@/hooks/queries/useArtistTopTracks'
import { useScopedPage } from '@/hooks/useScopedPage'
import { usePlayer } from '@/contexts/PlayerContext'
import { isNoData } from '@/lib/deezer'
import type { AlbumSimple, Artist, Image, Track } from '@/types/music'
import type { ViewMode } from '@/components/shared/ListTableSwitch'

interface ArtistMeta {
  artistImages: Image[]
  artistName: string
  artistLink: string | undefined
}

function deriveArtistMeta(data: Artist | undefined): ArtistMeta {
  if (!data) {
    return { artistImages: [], artistName: '', artistLink: undefined }
  }
  return {
    artistImages: data.images,
    artistName: data.name,
    artistLink: data.link,
  }
}

export function useArtistDetailPage(id: string | undefined) {
  const navigate = useNavigate()
  const location = useLocation()
  const { state, controls } = usePlayer()
  const playTrack = useCallback(
    async (track: Track, list?: Track[]) => {
      await controls.playTrack(track, list)
    },
    [controls]
  )

  const [albumPage, setAlbumPage] = useScopedPage(id)
  const [discographyView, setDiscographyView] = useState<ViewMode>('list')
  const [headerHeight, setHeaderHeight] = useState(0)

  const artist = useArtist(id)
  const albums = useArtistAlbums(id, albumPage, 10)

  const topTracks = useArtistTopTracks(id, 10)

  const hasNextAlbums =
    albums.data != null ? albums.data.offset + albums.data.limit < albums.data.total : false

  const handleHeaderHeightChange = useCallback((height: number) => {
    setHeaderHeight(height)
  }, [])

  const handleAlbumClick = useCallback(
    (album: AlbumSimple) => {
      navigate(`/albums/${album.id}`, { state: { from: currentPath(location) } })
    },
    [navigate, location]
  )

  const meta = useMemo(() => deriveArtistMeta(artist.data), [artist.data])
  const albumItems = useMemo(() => albums.data?.items ?? [], [albums.data])
  const activeTrackId = state.currentTrack?.id
  const notFound = isNoData(artist.error)

  return useMemo(
    () => ({
      topTracks,
      discographyView,
      setDiscographyView,
      albumPage,
      setAlbumPage,
      headerHeight,
      hasNextAlbums,
      handleHeaderHeightChange,
      handleAlbumClick,
      playTrack,
      albumItems,
      activeTrackId,
      notFound,
      ...meta,
    }),
    [
      topTracks,
      discographyView,
      setDiscographyView,
      albumPage,
      setAlbumPage,
      headerHeight,
      hasNextAlbums,
      handleHeaderHeightChange,
      handleAlbumClick,
      playTrack,
      albumItems,
      activeTrackId,
      notFound,
      meta,
    ]
  )
}
