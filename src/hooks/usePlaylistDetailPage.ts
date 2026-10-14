import { useState, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePlaylist } from '@/hooks/queries/usePlaylist'
import { usePlaylistTracks } from '@/hooks/queries/usePlaylistTracks'
import { useScopedPage } from '@/hooks/useScopedPage'
import { useQueueLoader } from '@/hooks/useQueueLoader'
import { usePlayer } from '@/contexts/PlayerContext'
import { isPlayable } from '@/lib/deezerMappers'
import { isNoData } from '@/lib/deezer'
import { QUEUE_LIMIT } from '@/utils/constants'
import type { Track } from '@/types/music'
import type { ViewMode } from '@/components/shared/ListTableSwitch'

export const PLAYLIST_LIMIT = 20

export function usePlaylistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  const [page, setPage] = useScopedPage(id)
  const [view, setView] = useState<ViewMode>('list')
  const [headerHeight, setHeaderHeight] = useState(0)

  const playlist = usePlaylist(id)
  const tracks = usePlaylistTracks(id ?? '', !!id, page, PLAYLIST_LIMIT)
  const allTracks = usePlaylistTracks(id ?? '', !!id, 1, QUEUE_LIMIT, true)
  const { state: playerState, controls } = usePlayer()

  const playlistTracks: Track[] = useMemo(() => tracks.data?.items ?? [], [tracks.data])
  const loadQueue = useQueueLoader(allTracks)
  const pageOffset = (page - 1) * PLAYLIST_LIMIT

  const playTrack = useCallback(
    async (track: Track, index: number) => {
      const all = await loadQueue()
      if (all) await controls.playTrack(track, all, index)
      else await controls.playTrack(track, playlistTracks, index - pageOffset)
    },
    [controls, loadQueue, playlistTracks, pageOffset]
  )

  const playFirst = useCallback(async () => {
    const queue = (await loadQueue()) ?? playlistTracks
    const first = queue.find(isPlayable)
    if (first) await controls.playTrack(first, queue)
  }, [loadQueue, playlistTracks, controls])

  const handlePlay = useCallback(() => {
    void playFirst()
  }, [playFirst])

  const handleLayout = useCallback((h: number) => {
    setHeaderHeight(h)
  }, [])

  const hasNext = tracks.data ? tracks.data.offset + tracks.data.limit < tracks.data.total : false
  const ownerName = playlist.data?.owner?.display_name
  const subtitle = ownerName ? t('playlistDetail.owner', { name: ownerName }) : ''

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
    notFound: isNoData(playlist.error),
    subtitle,
    handlePlay,
    handleLayout,
    playTrack,
  }
}
