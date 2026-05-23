import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useArtist } from '@/hooks/queries/useArtist'
import { useArtistTopTracks } from '@/hooks/queries/useArtistTopTracks'
import { useArtistAlbums } from '@/hooks/queries/useArtistAlbums'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { usePlayContext } from '@/hooks/usePlayContext'
import { ArcCarousel } from '@/components/vinyl/ArcCarousel'
import { VinylDisk } from '@/components/vinyl/VinylDisk'
import { VinylCard } from '@/components/shared/VinylCard'
import { TrackRow } from '@/components/shared/TrackRow'
import { Pagination } from '@/components/shared/Pagination'
import { usePlayer } from '@/hooks/usePlayer'

const DELAY = 0.3

function useArtistLayout() {
  const [vw, setVw] = useState(() => window.innerWidth)
  useEffect(() => {
    const fn = () => setVw(window.innerWidth)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const diskPx = Math.min(720, vw)
  const translateY = Math.round(diskPx * 0.28)
  const arcRadius = Math.max(130, Math.round(diskPx * 0.36))
  const arcDeg = vw < 768 ? 130 : 90
  const arcContainerTop = Math.max(80, diskPx - translateY - arcRadius - 20)
  // deepest card = arcContainerTop + arcRadius + 60; add 80px breathing room
  const fixedZoneHeight = arcContainerTop + arcRadius + 60 + 80

  return { diskPx, translateY, arcRadius, arcDeg, arcContainerTop, fixedZoneHeight }
}

export function ArtistDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { state } = usePlayer()
  const playTrack = usePlayTrack()
  const playContext = usePlayContext()
  const [albumPage, setAlbumPage] = useState(1)
  const { diskPx, translateY, arcRadius, arcDeg, arcContainerTop, fixedZoneHeight } = useArtistLayout()

  const artist = useArtist(id)
  const topTracks = useArtistTopTracks(id)
  const albums = useArtistAlbums(id, albumPage, 10)

  const hasNextAlbums = albums.data
    ? (albums.data.offset + albums.data.limit) < albums.data.total
    : false

  const artistImage = artist.data?.images[0]?.url
  // Visible disk height from top of viewport
  const visibleDiskHeight = diskPx - translateY

  return (
    <div className="min-h-screen">
      {/* Fixed visual zone: disk + inverted carousel */}
      <div className="fixed inset-0 pointer-events-none z-[5]">
        {/* Disk at top, partially hidden above viewport */}
        <div
          className="absolute top-0 left-1/2"
          style={{ transform: `translateX(-50%) translateY(-${translateY}px)` }}
        >
          <motion.div
            initial={{ scale: 0.7, y: 80, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
          >
            <VinylDisk size="xl" isPlaying albumArt={artistImage} />
          </motion.div>
        </div>

        {/* Artist name — centered in the visible disk band */}
        <motion.div
          className="absolute left-0 right-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ top: 0, height: visibleDiskHeight * 0.55 }}
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <h1 className="text-3xl font-black text-white drop-shadow-lg tracking-tight">
            {artist.data?.name}
          </h1>
          {artist.data?.followers?.total != null && (
            <p className="text-xs text-white/50 mt-1">
              {artist.data.followers.total.toLocaleString()} {t('artists.followers')}
            </p>
          )}
        </motion.div>

        {/* Inverted arc carousel — cards hang DOWN from disk */}
        <div
          className="absolute left-1/2 pointer-events-auto"
          style={{ top: arcContainerTop, transform: 'translateX(-50%)' }}
        >
          {topTracks.data && topTracks.data.length > 0 && (
            <ArcCarousel
              items={topTracks.data.slice(0, 5).map((track, i) => ({
                id: track.id,
                content: (
                  <div className="flex flex-col items-center gap-1">
                    <VinylCard
                      track={track}
                      isActive={state.currentTrack?.id === track.id}
                      onPlay={playTrack}
                      size="sm"
                    />
                    <span className="text-[10px] font-bold text-black/40 tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                ),
              }))}
              radius={arcRadius}
              arcDeg={arcDeg}
              baseDelay={DELAY}
              title={t('artistDetail.topTracks')}
              inverted
            />
          )}
        </div>
      </div>

      {/* Scrollable content below fixed zone */}
      <div style={{ paddingTop: fixedZoneHeight }} className="px-4 pb-32">
        {/* Top tracks list */}
        {topTracks.data && topTracks.data.length > 0 && (
          <div className="mb-8">
            {topTracks.data.map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                index={i}
                isActive={state.currentTrack?.id === track.id}
                onPlay={playTrack}
              />
            ))}
          </div>
        )}

        {/* Albums */}
        <div>
          <h3 className="text-sm font-bold text-black/50 mb-3 px-2">{t('artistDetail.albums')}</h3>
          <div className="space-y-1">
            {albums.data?.items.map(album => (
              <div
                key={album.id}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 transition-colors cursor-pointer group"
                onClick={() => playContext(album.uri)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && playContext(album.uri)}
              >
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
