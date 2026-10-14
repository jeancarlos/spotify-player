import { useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePlaylist } from '@/hooks/queries/usePlaylist'
import { usePlaylistTracks } from '@/hooks/queries/usePlaylistTracks'
import { usePlayer } from '@/contexts/PlayerContext'
import { isPlayable } from '@/lib/deezerMappers'
import type { Track } from '@/types/music'
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
  const { state: playerState, controls } = usePlayer()

  const playlistTracks: Track[] = (tracks.data?.items ?? []).map((item) => item.item)

  const playTrack = useCallback(
    async (track: Track, list?: Track[]) => {
      await controls.playTrack(track, list)
    },
    [controls]
  )

  const handlePlay = useCallback(() => {
    const first = playlistTracks.find(isPlayable)
    if (first) void controls.playTrack(first, playlistTracks)
  }, [playlistTracks, controls])

  const handleLayout = useCallback((h: number) => {
    setHeaderHeight(h)
  }, [])

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
