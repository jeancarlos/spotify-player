import { useTranslation } from 'react-i18next'
import { usePlaylistDetailPage, PLAYLIST_LIMIT } from '@/hooks/usePlaylistDetailPage'
import { CollectionHeader } from '@/components/shared/CollectionHeader'
import { ListTableSwitch } from '@/components/shared/ListTableSwitch'
import { TrackRow } from '@/components/shared/TrackRow'
import { TrackTable } from '@/components/shared/TrackTable'
import { Pagination } from '@/components/shared/Pagination'
import type { SpotifyTrack } from '@/types/spotify'

export function PlaylistDetail() {
  const { t } = useTranslation()

  const {
    playlist,
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
  } = usePlaylistDetailPage()

  return (
    <div className="min-h-screen">
      <CollectionHeader
        imageUrl={playlist.data?.images[0]?.url}
        name={playlist.data?.name ?? ''}
        subtitle={subtitle}
        playLabel={t('playlistDetail.playPlaylist')}
        onPlay={handlePlay}
        onLayout={handleLayout}
      />

      <div style={{ paddingTop: headerHeight }} className="px-4 pb-32">
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-black/80">{t('playlistDetail.tracks')}</h2>
            <ListTableSwitch view={view} onChange={setView} />
          </div>

          {view === 'list' ? (
            <div className="flex flex-col gap-0.5">
              {playlistTracks.map((track, i) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={(page - 1) * PLAYLIST_LIMIT + i}
                  isActive={playerState.currentTrack?.id === track.id}
                  onPlay={async (tr) => {
                    await playTrack(tr as SpotifyTrack, playlistTracks)
                  }}
                />
              ))}
            </div>
          ) : (
            <TrackTable
              tracks={playlistTracks}
              showAlbumColumn={true}
              activeTrackId={playerState.currentTrack?.id}
              onPlay={(track) => {
                void playTrack(track as SpotifyTrack, playlistTracks)
              }}
            />
          )}

          {(page > 1 || hasNext) && (
            <Pagination
              page={page}
              hasNext={hasNext}
              onPrev={() => {
                setPage((p) => Math.max(1, p - 1))
              }}
              onNext={() => {
                setPage((p) => p + 1)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
