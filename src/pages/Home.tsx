import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useRecentlyPlayed } from '@/hooks/queries/useRecentlyPlayed'
import { usePlayer } from '@/hooks/usePlayer'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { VinylDisk } from '@/components/vinyl/VinylDisk'
import { ArcCarousel } from '@/components/vinyl/ArcCarousel'
import { VinylCard } from '@/components/shared/VinylCard'
import { SearchBar } from '@/components/shared/SearchBar'
import type { SearchTab } from '@/components/shared/SearchBar'
import type { SpotifyTrack } from '@/types/spotify'

const DISK_DONE_DELAY = 0.75

function useDiskLayout() {
  const [vw, setVw] = useState(() => window.innerWidth)
  useEffect(() => {
    const fn = () => setVw(window.innerWidth)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const diskPx = Math.min(720, vw)
  const translateY = Math.round(diskPx * 0.28)
  const arcRadius = Math.max(130, Math.round(diskPx * 0.36))
  const arcBottom = Math.max(80, diskPx - translateY - arcRadius - 20)

  return { translateY, arcRadius, arcBottom }
}

export function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state } = usePlayer()
  const playTrack = usePlayTrack()
  const recentlyPlayed = useRecentlyPlayed(5)
  const { translateY, arcRadius, arcBottom } = useDiskLayout()

  const tracks: SpotifyTrack[] = recentlyPlayed.data?.map(i => i.track) ?? []

  const handleSearch = useCallback((query: string, tab: SearchTab) => {
    if (query.trim()) navigate(`/artists?q=${encodeURIComponent(query)}&tab=${tab}`)
  }, [navigate])

  const albumArt = state.currentTrack?.album.images[0]?.url

  return (
    <div className="h-screen bg-white overflow-hidden relative">
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* SearchBar */}
      <div className="fixed top-14 left-0 right-0 z-20 flex justify-center px-4 pt-2">
        <SearchBar onSearch={handleSearch} className="shadow-sm" />
      </div>

      {/* "Recently Played" label — floats above the arc */}
      <div
        className="fixed left-0 right-0 text-center pointer-events-none z-10"
        style={{ bottom: arcBottom + arcRadius + 96 }}
      >
        <h2 className="text-sm font-bold text-black/50">{t('home.recentlyPlayed')}</h2>
      </div>

      {/* Fixed vinyl + arc */}
      <div className="fixed inset-0 pointer-events-none z-[5]">
        {/* Arc Carousel */}
        <div
          className="absolute left-1/2 pointer-events-auto"
          style={{ bottom: arcBottom, transform: 'translateX(-50%)' }}
        >
          {tracks.length > 0 && (
            <ArcCarousel
              items={tracks.map(track => (
                <VinylCard
                  key={track.id}
                  track={track}
                  isActive={state.currentTrack?.id === track.id}
                  onPlay={playTrack}
                  size="sm"
                />
              ))}
              radius={arcRadius}
              arcDeg={90}
              baseDelay={DISK_DONE_DELAY}
            />
          )}
        </div>

        {/* VinylDisk */}
        <div
          className="absolute bottom-0 left-1/2"
          style={{ transform: `translateX(-50%) translateY(${translateY}px)` }}
        >
          <motion.div
            initial={{ scale: 0.7, y: 60, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
          >
            <VinylDisk size="xl" isPlaying={state.isPlaying} albumArt={albumArt} />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
