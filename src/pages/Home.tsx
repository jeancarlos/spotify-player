import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRecentlyPlayed } from '@/hooks/queries/useRecentlyPlayed'
import { usePlayer } from '@/hooks/usePlayer'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { VinylDisk } from '@/components/vinyl/VinylDisk'
import { ArcCarousel } from '@/components/vinyl/ArcCarousel'
import { VinylCard } from '@/components/shared/VinylCard'
import { SearchBar } from '@/components/shared/SearchBar'
import type { SearchTab } from '@/components/shared/SearchBar'
import type { SpotifyTrack } from '@/types/spotify'

export function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state } = usePlayer()
  const playTrack = usePlayTrack()
  const recentlyPlayed = useRecentlyPlayed(10)
  const [offsetDeg, setOffsetDeg] = useState(0)

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
        {/* Vinyl disk — base */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-[-20px]">
          <VinylDisk size="lg" isPlaying={state.isPlaying} albumArt={albumArt} />
        </div>

        {/* Arc Carousel — centered on vinyl disk */}
        <div className="absolute bottom-[260px] left-1/2 -translate-x-1/2">
          {tracks.length > 0 && (
            <ArcCarousel
              items={tracks.map(track => (
                <VinylCard
                  key={track.id}
                  track={track}
                  isActive={state.currentTrack?.id === track.id}
                  onPlay={playTrack}
                  size="md"
                />
              ))}
              radius={280}
              arcDeg={140}
              offsetDeg={offsetDeg}
            />
          )}
        </div>

        {/* Navigation arrows */}
        <button
          onClick={() => setOffsetDeg(o => o - 18)}
          className="absolute left-6 top-1/2 -translate-y-1/2 glass rounded-full p-2.5 hover:bg-black/5 transition-colors"
          aria-label="Anterior"
        >
          <ChevronLeft size={20} className="text-black/60" />
        </button>
        <button
          onClick={() => setOffsetDeg(o => o + 18)}
          className="absolute right-6 top-1/2 -translate-y-1/2 glass rounded-full p-2.5 hover:bg-black/5 transition-colors"
          aria-label="Próximo"
        >
          <ChevronRight size={20} className="text-black/60" />
        </button>
      </div>
    </div>
  )
}
