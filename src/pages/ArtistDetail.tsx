import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useArtistDetailPage } from '@/hooks/useArtistDetailPage'
import { ArtistHeader } from '@/components/artist/ArtistHeader'
import { ArtistBio } from '@/components/artist/ArtistBio'
import { ArtistDiscography } from '@/components/artist/ArtistDiscography'
import { ArtistTopTracksChart } from '@/components/artist/ArtistTopTracksChart'

export function ArtistDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  const {
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
    artistImages,
    artistName,
    artistLink,
    albumItems,
    activeTrackId,
  } = useArtistDetailPage(id)

  return (
    <div className="min-h-screen">
      <ArtistHeader
        images={artistImages}
        name={artistName}
        link={artistLink}
        onLayout={handleHeaderHeightChange}
      />

      <div style={{ paddingTop: headerHeight }} className="pb-32">
        <div className="max-w-3xl mx-auto px-4">
          <ArtistBio artistName={artistName} />

          {(topTracks.data?.length ?? 0) > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between px-2 mb-3">
                <h3 className="text-sm font-bold text-black/60">
                  {t('artistDetail.topTracksRanked')}
                </h3>
              </div>
              <ArtistTopTracksChart
                tracks={topTracks.data ?? []}
                activeTrackId={activeTrackId}
                onPlay={async (track) => playTrack(track, (topTracks.data ?? []))}
              />
            </section>
          )}

          <ArtistDiscography
            albums={albumItems}
            view={discographyView}
            onViewChange={setDiscographyView}
            onAlbumClick={handleAlbumClick}
            page={albumPage}
            hasNext={hasNextAlbums}
            onPrevPage={() => {
              setAlbumPage((prevPage) => Math.max(1, prevPage - 1))
            }}
            onNextPage={() => {
              setAlbumPage((prevPage) => prevPage + 1)
            }}
          />
        </div>
      </div>
    </div>
  )
}
