import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useArtist } from '@/hooks/queries/useArtist'
import { useArtistTopTracks } from '@/hooks/queries/useArtistTopTracks'
import { useArtistAlbums } from '@/hooks/queries/useArtistAlbums'
import { useArtistDiscographyTracks } from '@/hooks/queries/useArtistDiscographyTracks'
import { usePlayContext } from '@/hooks/usePlayContext'
import { usePlayer } from '@/hooks/usePlayer'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { ArtistHeroSection } from '@/components/artist/ArtistHeroSection'
import { ArtistBio } from '@/components/artist/ArtistBio'
import { RelatedArtists } from '@/components/artist/RelatedArtists'
import { ArtistDiscography } from '@/components/artist/ArtistDiscography'
import { ArtistTopTracksChart } from '@/components/artist/ArtistTopTracksChart'
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
  const [heroHeight, setHeroHeight] = useState(340)

  const artist = useArtist(id)
  const topTracks = useArtistTopTracks(id)
  const albums = useArtistAlbums(id, albumPage, 10)
  const discographyTracks = useArtistDiscographyTracks(id)

  const hasNextAlbums = albums.data
    ? albums.data.offset + albums.data.limit < albums.data.total
    : false

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
        onLayout={setHeroHeight}
        carouselTitle={t('artistDetail.topTracks')}
      />

      <div style={{ paddingTop: heroHeight }} className="pb-32">
        <div className="max-w-3xl mx-auto px-4">
          <ArtistBio artistName={artist.data?.name} />

          {discographyTracks.data.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between px-2 mb-3">
                <h2 className="text-xs font-bold text-black/40 uppercase tracking-wider">
                  {t('artistDetail.topTracksRanked')}
                </h2>
                {artist.data?.uri && (
                  <button
                    onClick={() => playContext(artist.data!.uri)}
                    className="text-[10px] font-bold text-black/35 hover:text-black uppercase tracking-wider transition-colors outline-none"
                  >
                    {t('player.play')}
                  </button>
                )}
              </div>
              <ArtistTopTracksChart
                tracks={discographyTracks.data}
                activeTrackId={state.currentTrack?.id}
                onPlay={(track) => playTrack(track, discographyTracks.data)}
              />
            </section>
          )}

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

          <RelatedArtists artistId={id} />
        </div>
      </div>
    </div>
  )
}
