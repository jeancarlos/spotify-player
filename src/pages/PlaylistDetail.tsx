import { useState, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePlaylist } from '@/hooks/queries/usePlaylist'
import { usePlaylistTracks } from '@/hooks/queries/usePlaylistTracks'
import { usePlayContext } from '@/hooks/usePlayContext'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { usePlayer } from '@/hooks/usePlayer'
import { CollectionHeader } from '@/components/shared/CollectionHeader'
import { ListTableSwitch, ViewMode } from '@/components/shared/ListTableSwitch'
import { TrackRow } from '@/components/shared/TrackRow'
import { TrackTable } from '@/components/shared/TrackTable'
import { Pagination } from '@/components/shared/Pagination'
import type { SpotifyTrack } from '@/types/spotify'

const LIMIT = 20

export function PlaylistDetail() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [page, setPage] = useState(1)
  const [view, setView] = useState<ViewMode>('list')
  const [headerHeight, setHeaderHeight] = useState(0)

  const playlist = usePlaylist(id)
  const tracks = usePlaylistTracks(id ?? '', !!id, page, LIMIT)
  const playContext = usePlayContext()
  const playTrack = usePlayTrack()
  const { state: playerState } = usePlayer()

  const handleBack = useCallback(() => {
    const from = (location.state as { from?: string } | null)?.from
    navigate(from ?? '/')
  }, [location.state, navigate])

  const handlePlay = useCallback(() => {
    if (playlist.data?.uri) playContext(playlist.data.uri)
  }, [playlist.data?.uri, playContext])

  const handleLayout = useCallback((h: number) => {
    setHeaderHeight(h)
  }, [])

  const playlistTracks: SpotifyTrack[] = (tracks.data?.items ?? [])
    .map(item => item.track ?? item.item)
    .filter((t): t is SpotifyTrack => t != null)

  const hasNext = tracks.data
    ? tracks.data.offset + tracks.data.limit < tracks.data.total
    : false

  const ownerName = playlist.data?.owner?.display_name ?? ''
  const subtitle = t('playlistDetail.owner', { name: ownerName })

  return (
    <div className="min-h-screen">
      <CollectionHeader
        imageUrl={playlist.data?.images?.[0]?.url}
        name={playlist.data?.name ?? ''}
        subtitle={subtitle}
        playLabel={t('playlistDetail.playPlaylist')}
        onPlay={handlePlay}
        onBack={handleBack}
        onLayout={handleLayout}
      />

      <div style={{ paddingTop: headerHeight }} className="px-4 pb-32">
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-black/80">
              {t('playlistDetail.tracks')}
            </h2>
            <ListTableSwitch view={view} onChange={setView} />
          </div>

          {view === 'list' ? (
            <div className="flex flex-col gap-0.5">
              {playlistTracks.map((track, i) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={(page - 1) * LIMIT + i}
                  isActive={playerState?.track?.id === track.id}
                  onPlay={tr => playTrack(tr, playlistTracks)}
                />
              ))}
            </div>
          ) : (
            <TrackTable
              tracks={playlistTracks}
              showAlbumColumn={true}
              activeTrackId={playerState?.track?.id}
              onPlay={(track) => {
                playTrack(track as SpotifyTrack, playlistTracks)
              }}
            />
          )}

          {(page > 1 || hasNext) && (
            <Pagination
              page={page}
              hasNext={hasNext}
              onPrev={() => setPage(p => Math.max(1, p - 1))}
              onNext={() => setPage(p => p + 1)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
