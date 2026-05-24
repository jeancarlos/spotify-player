import { useAlbumDetailPage, ALBUM_LIMIT } from '@/hooks/useAlbumDetailPage'
import { CollectionHeader } from '@/components/shared/CollectionHeader'
import { ListTableSwitch } from '@/components/shared/ListTableSwitch'
import { TrackRow } from '@/components/shared/TrackRow'
import { TrackTable } from '@/components/shared/TrackTable'
import { Pagination } from '@/components/shared/Pagination'
import type { SpotifyTrack, SpotifyAlbumTrack } from '@/types/spotify'

export function AlbumDetail() {
  const {
    albumItems,
    enrichedTracks,
    enrichTrackInline,
    playerState,
    view,
    setView,
    page,
    setPage,
    headerHeight,
    hasNext,
    albumYear,
    albumSubtitle,
    imageUrl,
    albumName,
    albumArtists,
    handlePlay,
    handleLayout,
    handleArtistClick,
    playTrack,
    t,
  } = useAlbumDetailPage()

  return (
    <div className="min-h-screen">
      <CollectionHeader
        imageUrl={imageUrl}
        name={albumName}
        subtitle={albumSubtitle}
        artists={albumArtists}
        year={albumYear}
        playLabel={t('albumDetail.playAlbum')}
        onPlay={handlePlay}
        onLayout={handleLayout}
        onArtistClick={handleArtistClick}
      />

      <div style={{ paddingTop: headerHeight }} className="pb-32">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-black/80">{t('albumDetail.tracks')}</h2>
              <ListTableSwitch view={view} onChange={setView} />
            </div>

            {view === 'list' ? (
              <div className="flex flex-col gap-0.5">
                {enrichedTracks.map((track, i) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    index={(page - 1) * ALBUM_LIMIT + i}
                    isActive={playerState.currentTrack?.id === track.id}
                    onPlay={async (tr) => {
                      await playTrack(tr as SpotifyTrack, enrichedTracks)
                    }}
                  />
                ))}
              </div>
            ) : (
              <TrackTable
                tracks={albumItems}
                showAlbumColumn={false}
                activeTrackId={playerState.currentTrack?.id}
                onPlay={(track) => {
                  void playTrack(enrichTrackInline(track as SpotifyAlbumTrack), enrichedTracks)
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
    </div>
  )
}
