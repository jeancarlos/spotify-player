import { useCallback } from 'react'
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

export function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state } = usePlayer()
  const playTrack = usePlayTrack()
  const recentlyPlayed = useRecentlyPlayed(7)

  const tracks: SpotifyTrack[] = recentlyPlayed.data?.map(i => i.track) ?? []

  const handleSearch = useCallback((query: string, tab: SearchTab) => {
    if (query.trim()) navigate(`/artists?q=${encodeURIComponent(query)}&tab=${tab}`)
  }, [navigate])

  const albumArt = state.currentTrack?.album.images[0]?.url

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* SearchBar */}
      <div className="fixed top-14 left-0 right-0 z-20 flex justify-center px-4 pt-2">
        <SearchBar onSearch={handleSearch} className="shadow-sm" />
      </div>

      {/* Title */}
      <div className="pt-36 text-center px-4">
        <h2 className="text-lg font-bold text-black/60">{t('home.recentlyPlayed')}</h2>
      </div>

      {/* Vinyl + Arc Carousel */}
      <div className="relative flex justify-center mt-4" style={{ height: 580 }}>
        {/* Arc Carousel — centered above the vinyl */}
        <div className="absolute bottom-[260px] left-1/2 -translate-x-1/2">
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
              radius={220}
              arcDeg={110}
              baseDelay={DISK_DONE_DELAY}
            />
          )}
        </div>

        {/* VinylDisk — entrance from bottom */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-[-20px]"
          initial={{ scale: 0.6, y: 80, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
        >
          <VinylDisk size="lg" isPlaying={state.isPlaying} albumArt={albumArt} />
        </motion.div>
      </div>
    </div>
  )
}
