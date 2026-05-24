import { useState, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useArtist } from '@/hooks/queries/useArtist'
import { useArtistAlbums } from '@/hooks/queries/useArtistAlbums'
import { useArtistDiscographyTracks } from '@/hooks/queries/useArtistDiscographyTracks'
import { usePlayer } from '@/hooks/usePlayer'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { ArtistHeader } from '@/components/artist/ArtistHeader'
import { ArtistBio } from '@/components/artist/ArtistBio'
import { RelatedArtists } from '@/components/artist/RelatedArtists'
import { ArtistDiscography } from '@/components/artist/ArtistDiscography'
import { ArtistTopTracksChart } from '@/components/artist/ArtistTopTracksChart'
import type { ViewMode } from '@/components/shared/ListTableSwitch'
import type { SpotifyAlbumSimple } from '@/types/spotify'

export function ArtistDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const { state } = usePlayer()
  const playTrack = usePlayTrack()

  const [albumPage, setAlbumPage] = useState(1)
  const [discView, setDiscView] = useState<ViewMode>('list')
  const [headerHeight, setHeaderHeight] = useState(0)

  const artist = useArtist(id)
  const albums = useArtistAlbums(id, albumPage, 10)
  const discographyTracks = useArtistDiscographyTracks(id)

  const hasNextAlbums = albums.data
    ? albums.data.offset + albums.data.limit < albums.data.total
    : false

  const handleLayout = useCallback((h: number) => { setHeaderHeight(h); }, [])

  function handleAlbumClick(album: SpotifyAlbumSimple) {
    navigate(`/albums/${album.id}`, { state: { from: location.pathname } })
  }

  const artistSubtitle = artist.data?.genres?.slice(0, 2).join(' · ') ?? ''

  return (
    <div className="min-h-screen">
      <ArtistHeader
        imageUrl={artist.data?.images[0]?.url}
        name={artist.data?.name ?? ''}
        subtitle={artistSubtitle}
        onLayout={handleLayout}
      />

      <div style={{ paddingTop: headerHeight }} className="pb-32">
        <div className="max-w-3xl mx-auto px-4">
          <ArtistBio artistName={artist.data?.name} />

          {discographyTracks.data.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between px-2 mb-3">
                <h3 className="text-sm font-bold text-black/50">
                  {t('artistDetail.topTracksRanked')}
                </h3>
              </div>
              <ArtistTopTracksChart
                tracks={discographyTracks.data}
                activeTrackId={state.currentTrack?.id}
                onPlay={async (track) => playTrack(track, discographyTracks.data)}
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
            onPrevPage={() => { setAlbumPage((p) => Math.max(1, p - 1)); }}
            onNextPage={() => { setAlbumPage((p) => p + 1); }}
          />

          <RelatedArtists artistId={id} />
        </div>
      </div>
    </div>
  )
}
