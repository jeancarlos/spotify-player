import { useState, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useArtist } from '@/hooks/queries/useArtist'
import { useArtistAlbums } from '@/hooks/queries/useArtistAlbums'
import { useArtistDiscographyTracks } from '@/hooks/queries/useArtistDiscographyTracks'
import { usePlayer } from '@/hooks/usePlayer'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import type { SpotifyAlbumSimple, SpotifyArtist } from '@/types/spotify'
import type { ViewMode } from '@/components/shared/ListTableSwitch'

interface ArtistMeta {
  artistSubtitle: string
  artistImageUrl: string | undefined
  artistName: string
}

function deriveArtistMeta(data: SpotifyArtist | undefined): ArtistMeta {
  if (!data) {
    return { artistSubtitle: '', artistImageUrl: undefined, artistName: '' }
  }
  const genres = data.genres?.slice(0, 2) ?? []
  return {
    artistSubtitle: genres.join(' · '),
    artistImageUrl: data.images[0]?.url,
    artistName: data.name,
  }
}

export function useArtistDetailPage(id: string | undefined) {
  const navigate = useNavigate()
  const location = useLocation()
  const { state } = usePlayer()
  const playTrack = usePlayTrack()

  const [albumPage, setAlbumPage] = useState(1)
  const [discView, setDiscView] = useState<ViewMode>('list')
  const [headerHeight, setHeaderHeight] = useState(0)

  const artist = useArtist(id)
  const albums = useArtistAlbums(id, albumPage, 10)
  
  // Only pass the first few albums for discography tracks calculation
  const initialAlbums = useMemo(() => albums.data?.items ?? [], [albums.data?.items])
  const discographyTracks = useArtistDiscographyTracks(id, 10, initialAlbums)

  const hasNextAlbums =
    albums.data != null ? albums.data.offset + albums.data.limit < albums.data.total : false

  const handleLayout = useCallback((h: number) => {
    setHeaderHeight(h)
  }, [])

  const handleAlbumClick = useCallback(
    (album: SpotifyAlbumSimple) => {
      navigate(`/albums/${album.id}`, { state: { from: location.pathname } })
    },
    [navigate, location.pathname]
  )

  const meta = useMemo(() => deriveArtistMeta(artist.data), [artist.data])
  const albumItems = useMemo(() => albums.data?.items ?? [], [albums.data])
  const activeTrackId = state.currentTrack?.id

  return useMemo(
    () => ({
      discographyTracks,
      discView,
      setDiscView,
      albumPage,
      setAlbumPage,
      headerHeight,
      hasNextAlbums,
      handleLayout,
      handleAlbumClick,
      playTrack,
      albumItems,
      activeTrackId,
      ...meta,
    }),
    [
      discographyTracks,
      discView,
      setDiscView,
      albumPage,
      setAlbumPage,
      headerHeight,
      hasNextAlbums,
      handleLayout,
      handleAlbumClick,
      playTrack,
      albumItems,
      activeTrackId,
      meta,
    ]
  )
}
