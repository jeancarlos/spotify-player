import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useArtistDetailPage } from '@/hooks/useArtistDetailPage'
import { ArtistHeader } from '@/components/artist/ArtistHeader'
import { ArtistBio } from '@/components/artist/ArtistBio'
import { RelatedArtists } from '@/components/artist/RelatedArtists'
import { ArtistDiscography } from '@/components/artist/ArtistDiscography'
import { ArtistTopTracksChart } from '@/components/artist/ArtistTopTracksChart'

export function ArtistDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  const {
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
    artistSubtitle,
    artistImageUrl,
    artistName,
    albumItems,
    activeTrackId,
  } = useArtistDetailPage(id)

  return (
    <div className="min-h-screen">
      <ArtistHeader
        imageUrl={artistImageUrl}
        name={artistName}
        subtitle={artistSubtitle}
        onLayout={handleLayout}
      />

      <div style={{ paddingTop: headerHeight }} className="pb-32">
        <div className="max-w-3xl mx-auto px-4">
          <ArtistBio artistName={artistName} />

          {discographyTracks.data.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between px-2 mb-3">
                <h3 className="text-sm font-bold text-black/50">
                  {t('artistDetail.topTracksRanked')}
                </h3>
              </div>
              <ArtistTopTracksChart
                tracks={discographyTracks.data}
                activeTrackId={activeTrackId}
                onPlay={async (track) => playTrack(track, discographyTracks.data)}
              />
            </section>
          )}

          <ArtistDiscography
            albums={albumItems}
            view={discView}
            onViewChange={setDiscView}
            onAlbumClick={handleAlbumClick}
            page={albumPage}
            hasNext={hasNextAlbums}
            onPrevPage={() => {
              setAlbumPage((p) => Math.max(1, p - 1))
            }}
            onNextPage={() => {
              setAlbumPage((p) => p + 1)
            }}
          />

          <RelatedArtists artistId={id} />
        </div>
      </div>
    </div>
  )
}
