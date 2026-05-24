import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useArtist } from '@/hooks/queries/useArtist'
import { useArtistTopTracks } from '@/hooks/queries/useArtistTopTracks'
import { useArtistAlbums } from '@/hooks/queries/useArtistAlbums'
import { useAudioFeatures } from '@/hooks/queries/useAudioFeatures'
import { usePlayContext } from '@/hooks/usePlayContext'
import { usePlayer } from '@/hooks/usePlayer'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { ArtistHeroSection } from '@/components/artist/ArtistHeroSection'
import { ArtistBio } from '@/components/artist/ArtistBio'
import { RelatedArtists } from '@/components/artist/RelatedArtists'
import { ArtistDiscography } from '@/components/artist/ArtistDiscography'
import { ArtistTopTracksList } from '@/components/artist/ArtistTopTracksList'
import { MusicalProfileCharts } from '@/components/shared/MusicalProfileCharts'
import { averageAudioFeatures } from '@/utils/audioFeatures'
import type { ViewMode } from '@/components/shared/ListTableSwitch'
import type { SpotifyAlbumSimple, SpotifyTrack } from '@/types/spotify'

export function ArtistDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const { state } = usePlayer()
  const playContext = usePlayContext()
  const playTrack = usePlayTrack()

  const [albumPage, setAlbumPage] = useState(1)
  const [discView, setDiscView] = useState<ViewMode>('list')
  const [fixedZoneHeight, setFixedZoneHeight] = useState(340)

  const artist = useArtist(id)
  const topTracks = useArtistTopTracks(id)
  const albums = useArtistAlbums(id, albumPage, 10)

  const topTrackIds = topTracks.data?.slice(0, 5).map((t) => t.id) ?? []
  const audioFeatures = useAudioFeatures(topTrackIds)
  const avgFeatures = (() => {
    if (!audioFeatures.data || audioFeatures.data.length === 0) return null
    return averageAudioFeatures(audioFeatures.data)
  })()

  const hasNextAlbums = albums.data
    ? albums.data.offset + albums.data.limit < albums.data.total
    : false

  function handleBack() {
    const from = (location.state as { from?: string } | null)?.from
    navigate(from ?? '/artists')
  }

  function handleAlbumClick(album: SpotifyAlbumSimple) {
    navigate(`/albums/${album.id}`, { state: { from: location.pathname } })
  }

  function handleTrackPlay(track: SpotifyTrack) {
    if (artist.data?.uri) {
      playContext(artist.data.uri)
    } else {
      playTrack(track)
    }
  }

  return (
    <div className="min-h-screen">
      <ArtistHeroSection
        artist={artist.data}
        topTracks={topTracks.data}
        activeTrackId={state.currentTrack?.id}
        onTrackPlay={handleTrackPlay}
        onBack={handleBack}
        onLayout={setFixedZoneHeight}
        carouselTitle={t('artistDetail.topTracks')}
      />

      <div style={{ paddingTop: fixedZoneHeight }} className="px-4 pb-32">
        <ArtistTopTracksList
          tracks={topTracks.data ?? []}
          artistUri={artist.data?.uri}
          onPlayContext={playContext}
        />

        <ArtistBio artistName={artist.data?.name} />

        <ArtistDiscography
          albums={albums.data?.items ?? []}
          view={discView}
          onViewChange={setDiscView}
          onAlbumClick={handleAlbumClick}
          page={albumPage}
          hasNext={hasNextAlbums}
          onPrevPage={() => setAlbumPage((p) => Math.max(1, p - 1))}
          onNextPage={() => setAlbumPage((p) => p + 1)}
        />

        {/* Musical profile */}
        {avgFeatures && (
          <section className="mb-8 px-2">
            <h3 className="text-sm font-bold text-black/50 mb-4">
              {t('artistDetail.musicalProfile')}
            </h3>
            <MusicalProfileCharts features={avgFeatures} theme="light" />
          </section>
        )}

        {/* Related artists */}
        <RelatedArtists artistId={id} />
      </div>
    </div>
  )
}
