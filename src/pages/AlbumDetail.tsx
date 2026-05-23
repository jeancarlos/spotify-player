import { useState, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAlbum } from '@/hooks/queries/useAlbum'
import { useAlbumTracks } from '@/hooks/queries/useAlbumTracks'
import { useAudioFeatures } from '@/hooks/queries/useAudioFeatures'
import { usePlayContext } from '@/hooks/usePlayContext'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { usePlayer } from '@/hooks/usePlayer'
import { CollectionHeader } from '@/components/shared/CollectionHeader'
import { ListTableSwitch, type ViewMode } from '@/components/shared/ListTableSwitch'
import { TrackRow } from '@/components/shared/TrackRow'
import { TrackTable } from '@/components/shared/TrackTable'
import { MusicalProfileCharts } from '@/components/shared/MusicalProfileCharts'
import { Pagination } from '@/components/shared/Pagination'
import { averageAudioFeatures } from '@/utils/audioFeatures'
import type { SpotifyTrack, SpotifyAlbumTrack } from '@/types/spotify'

const LIMIT = 20

export function AlbumDetail() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [page, setPage] = useState(1)
  const [view, setView] = useState<ViewMode>('list')
  const [headerHeight, setHeaderHeight] = useState(0)

  const album = useAlbum(id)
  const tracks = useAlbumTracks(id, page, LIMIT)
  const playContext = usePlayContext()
  const playTrack = usePlayTrack()
  const { state: playerState } = usePlayer()

  const trackIds = (tracks.data?.items ?? []).map(t => t.id)
  const audioFeatures = useAudioFeatures(trackIds)

  const avgFeatures = audioFeatures.data && audioFeatures.data.length > 0
    ? averageAudioFeatures(audioFeatures.data)
    : null

  const handleBack = useCallback(() => {
    const from = (location.state as { from?: string } | null)?.from
    navigate(from ?? '/artists')
  }, [location.state, navigate])

  const handlePlay = useCallback(() => {
    if (album.data?.uri) playContext(album.data.uri)
  }, [album.data, playContext])

  const handleLayout = useCallback((h: number) => {
    setHeaderHeight(h)
  }, [])

  const enrichTrack = useCallback((track: SpotifyAlbumTrack): SpotifyTrack => ({
    ...track,
    type: 'track',
    album: {
      id: album.data?.id ?? '',
      name: album.data?.name ?? '',
      images: album.data?.images ?? [],
      release_date: album.data?.release_date ?? '',
      album_type: album.data?.album_type ?? 'album',
      artists: album.data?.artists ?? [],
      uri: album.data?.uri ?? '',
      type: 'album',
    },
    popularity: 0,
  }), [album.data])

  const albumItems = tracks.data?.items ?? []
  const enrichedTracks: SpotifyTrack[] = albumItems.map(enrichTrack)

  const hasNext = tracks.data
    ? tracks.data.offset + tracks.data.limit < tracks.data.total
    : false

  const albumYear = album.data?.release_date
    ? album.data.release_date.slice(0, 4)
    : undefined

  const albumSubtitle = album.data
    ? album.data.artists.map(a => a.name).join(', ')
    : ''

  return (
    <div className="min-h-screen">
      <CollectionHeader
        imageUrl={album.data?.images?.[0]?.url}
        name={album.data?.name ?? ''}
        subtitle={albumSubtitle}
        year={albumYear}
        playLabel={t('albumDetail.playAlbum')}
        onPlay={handlePlay}
        onBack={handleBack}
        onLayout={handleLayout}
      />

      <div style={{ paddingTop: headerHeight }} className="px-4 pb-32">
        {/* Tracks section */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-black/80">
              {t('albumDetail.tracks')}
            </h2>
            <ListTableSwitch view={view} onChange={setView} />
          </div>

          {view === 'list' ? (
            <div className="flex flex-col gap-0.5">
              {enrichedTracks.map((track, i) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={(page - 1) * LIMIT + i}
                  isActive={playerState?.track?.id === track.id}
                  onPlay={t => playTrack(t, enrichedTracks)}
                />
              ))}
            </div>
          ) : (
            <TrackTable
              tracks={albumItems}
              audioFeatures={audioFeatures.data}
              showAlbumColumn={false}
              activeTrackId={playerState?.track?.id}
              onPlay={(track) => {
                const enriched = enrichTrack(track as SpotifyAlbumTrack)
                playTrack(enriched, enrichedTracks)
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

        {/* Musical profile section */}
        {avgFeatures && (
          <div className="mt-8 flex flex-col items-center">
            <h2 className="text-base font-bold text-black/80 mb-4 self-start">
              {t('albumDetail.musicalProfile')}
            </h2>
            <MusicalProfileCharts features={avgFeatures} theme="light" />
          </div>
        )}
      </div>
    </div>
  )
}
