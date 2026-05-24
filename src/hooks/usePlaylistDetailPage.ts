import { useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePlaylist } from '@/hooks/queries/usePlaylist'
import { usePlaylistTracks } from '@/hooks/queries/usePlaylistTracks'
import { usePlayContext } from '@/hooks/usePlayContext'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { usePlayer } from '@/hooks/usePlayer'
import type { SpotifyTrack } from '@/types/spotify'
import type { ViewMode } from '@/components/shared/ListTableSwitch'

export const PLAYLIST_LIMIT = 20

export function usePlaylistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  const [page, setPage] = useState(1)
  const [view, setView] = useState<ViewMode>('list')
  const [headerHeight, setHeaderHeight] = useState(0)

  const playlist = usePlaylist(id)
  const tracks = usePlaylistTracks(id ?? '', !!id, page, PLAYLIST_LIMIT)
  const playContext = usePlayContext()
  const playTrack = usePlayTrack()
  const { state: playerState } = usePlayer()

  const handlePlay = useCallback(() => {
    if (playlist.data?.uri) void playContext(playlist.data.uri)
  }, [playlist.data, playContext])

  const handleLayout = useCallback((h: number) => {
    setHeaderHeight(h)
  }, [])

  const playlistTracks: SpotifyTrack[] = (tracks.data?.items ?? []).map((item) => item.item)
  const hasNext = tracks.data ? tracks.data.offset + tracks.data.limit < tracks.data.total : false
  const ownerName = playlist.data?.owner.display_name ?? ''
  const subtitle = t('playlistDetail.owner', { name: ownerName })

  return {
    id,
    playlist,
    tracks,
    playlistTracks,
    playerState,
    view,
    setView,
    page,
    setPage,
    headerHeight,
    hasNext,
    subtitle,
    handlePlay,
    handleLayout,
    playTrack,
  }
}
