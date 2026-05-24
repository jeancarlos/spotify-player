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
import { ListTableSwitch, type ViewMode } from '@/components/shared/ListTableSwitch'
import { AlbumTable } from '@/components/shared/AlbumTable'
import { MusicalProfileCharts } from '@/components/shared/MusicalProfileCharts'
import { Pagination } from '@/components/shared/Pagination'
import { averageAudioFeatures } from '@/utils/audioFeatures'
import { formatDate } from '@/utils/formatDate'
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

  const renderDiscography = () => {
    const items = albums.data?.items ?? []
    if (discView === 'table') {
      return <AlbumTable albums={items} onClick={handleAlbumClick} />
    }

    return (
      <div className="space-y-1">
        {items.map((album) => (
          <div
            key={album.id}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 transition-colors cursor-pointer group focus:outline-none focus:bg-black/5"
            onClick={() => handleAlbumClick(album)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleAlbumClick(album)
              }
            }}
          >
            <img
              src={album.images[0]?.url}
              alt={album.name}
              className="w-10 h-10 rounded-lg object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-black truncate">{album.name}</p>
              <p className="text-xs text-black/40">
                {album.release_date ? formatDate(album.release_date, 'year') : ''}
              </p>
            </div>
            <span className="text-xs text-black/30 shrink-0 capitalize">{album.album_type}</span>
          </div>
        ))}
      </div>
    )
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
        {/* Top tracks numbered list */}
        {topTracks.data && topTracks.data.length > 0 && (
          <section className="mb-8">
            <h3 className="text-sm font-bold text-black/50 mb-3 px-2">
              {t('artistDetail.topTracksRanked')}
            </h3>
            <div className="space-y-1">
              {topTracks.data.slice(0, 5).map((track, i) => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 transition-colors cursor-pointer group focus:outline-none focus:bg-black/5"
                  onClick={() => artist.data?.uri && playContext(artist.data.uri)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      if (artist.data?.uri) playContext(artist.data.uri)
                    }
                  }}
                >
                  <span className="text-xs font-bold text-black/30 tabular-nums w-6 shrink-0 text-right">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {track.album?.images?.[0]?.url && (
                    <img
                      src={track.album.images[0].url}
                      alt={track.album.name}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-black truncate">{track.name}</p>
                    <p className="text-xs text-black/40 truncate">{track.album?.name}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-black/30 tabular-nums">
                      {track.popularity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Discography */}
        <section className="mb-8">
          <div className="flex items-center justify-between px-2 mb-3">
            <h3 className="text-sm font-bold text-black/50">{t('artistDetail.discography')}</h3>
            <ListTableSwitch view={discView} onChange={setDiscView} />
          </div>

          {renderDiscography()}

          <Pagination
            page={albumPage}
            hasNext={hasNextAlbums}
            onPrev={() => setAlbumPage((p) => Math.max(1, p - 1))}
            onNext={() => setAlbumPage((p) => p + 1)}
            className="mt-4"
          />
        </section>

        {/* Artist bio */}
        <ArtistBio artistName={artist.data?.name} />

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
