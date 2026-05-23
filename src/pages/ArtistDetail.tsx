import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { useArtist } from '@/hooks/queries/useArtist'
import { useArtistTopTracks } from '@/hooks/queries/useArtistTopTracks'
import { useArtistAlbums } from '@/hooks/queries/useArtistAlbums'
import { useAudioFeatures } from '@/hooks/queries/useAudioFeatures'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { ArcCarousel } from '@/components/vinyl/ArcCarousel'
import { VinylCard } from '@/components/shared/VinylCard'
import { TrackRow } from '@/components/shared/TrackRow'
import { Pagination } from '@/components/shared/Pagination'
import { usePlayer } from '@/hooks/usePlayer'

export function ArtistDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { state } = usePlayer()
  const playTrack = usePlayTrack()
  const [albumPage, setAlbumPage] = useState(1)

  const artist = useArtist(id)
  const topTracks = useArtistTopTracks(id)
  const albums = useArtistAlbums(id, albumPage, 10)

  const topIds = topTracks.data?.slice(0, 5).map(t => t.id) ?? []
  const audioFeatures = useAudioFeatures(topIds)

  const radarData = audioFeatures.data
    ? [
        { subject: t('artistDetail.danceability'), A: Math.round((audioFeatures.data[0]?.danceability ?? 0) * 100) },
        { subject: t('artistDetail.energy'), A: Math.round((audioFeatures.data[0]?.energy ?? 0) * 100) },
        { subject: t('artistDetail.valence'), A: Math.round((audioFeatures.data[0]?.valence ?? 0) * 100) },
        { subject: t('artistDetail.acousticness'), A: Math.round((audioFeatures.data[0]?.acousticness ?? 0) * 100) },
        { subject: t('artistDetail.liveness'), A: Math.round((audioFeatures.data[0]?.liveness ?? 0) * 100) },
      ]
    : []

  const hasNextAlbums = albums.data
    ? (albums.data.offset + albums.data.limit) < albums.data.total
    : false

  return (
    <div className="min-h-screen pb-24">
      {/* Artist hero */}
      <div className="relative h-64 overflow-hidden">
        {artist.data?.images[0]?.url && (
          <img
            src={artist.data.images[0].url}
            alt={artist.data.name}
            className="w-full h-full object-cover object-top"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
        <div className="absolute bottom-4 left-6">
          <h1 className="text-4xl font-black text-black">{artist.data?.name}</h1>
          <p className="text-sm text-black/50 mt-1">
            {artist.data?.followers?.total.toLocaleString()} {t('artists.followers')}
          </p>
        </div>
      </div>

      {/* Top Tracks Arc */}
      <div className="px-6 pt-4">
        <h2 className="text-base font-bold text-black/60 mb-2 text-center">{t('artistDetail.topTracks')}</h2>

        {topTracks.data && topTracks.data.length > 0 && (
          <div className="flex justify-center">
            <ArcCarousel
              items={topTracks.data.slice(0, 5).map((track, i) => ({
                id: track.id,
                content: (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-black/40">{String(i + 1).padStart(2, '0')}</span>
                    <VinylCard
                      track={track}
                      isActive={state.currentTrack?.id === track.id}
                      onPlay={playTrack}
                      size="md"
                    />
                  </div>
                )
              }))}
              radius={220}
              arcDeg={120}
            />
          </div>
        )}
      </div>

      {/* Full top tracks list */}
      <div className="px-4 mb-8">
        {topTracks.data?.map((track, i) => (
          <TrackRow
            key={track.id}
            track={track}
            index={i}
            isActive={state.currentTrack?.id === track.id}
            onPlay={playTrack}
          />
        ))}
      </div>

      {/* Charts + Albums */}
      <div className="px-6 flex flex-col lg:flex-row gap-8">
        {/* Radar chart */}
        {radarData.length > 0 && (
          <div className="glass-card p-5 lg:w-80 shrink-0">
            <p className="text-sm font-bold text-black mb-3">
              {t('artistDetail.audioProfile')}
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(0,0,0,0.1)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: 'rgba(0,0,0,0.5)', fontSize: 11 }}
                />
                <Radar
                  dataKey="A"
                  stroke="#111"
                  fill="#111"
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Albums table */}
        <div className="flex-1">
          <h3 className="text-sm font-bold text-black/60 mb-3">{t('artistDetail.albums')}</h3>
          <div className="space-y-2">
            {albums.data?.items.map(album => (
              <div key={album.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 transition-colors">
                <img
                  src={album.images[0]?.url}
                  alt={album.name}
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-black truncate">{album.name}</p>
                  <p className="text-xs text-black/40">{album.release_date?.slice(0, 4)}</p>
                </div>
                <span className="text-xs text-black/30 shrink-0 capitalize">{album.album_type}</span>
              </div>
            ))}
          </div>
          <Pagination
            page={albumPage}
            hasNext={hasNextAlbums}
            onPrev={() => setAlbumPage(p => Math.max(1, p - 1))}
            onNext={() => setAlbumPage(p => p + 1)}
            className="mt-4"
          />
        </div>
      </div>
    </div>
  )
}
