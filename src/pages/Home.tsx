import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useRecentlyPlayed } from '@/hooks/queries/useRecentlyPlayed'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { ArcCarousel } from '@/components/vinyl/ArcCarousel'
import { VinylCard } from '@/components/shared/VinylCard'
import { SearchBar } from '@/components/shared/SearchBar'
import type { SearchTab } from '@/utils/search'
import type { SpotifyTrack } from '@/types/spotify'

const DISK_DONE_DELAY = 0.75

function useDiskLayout() {
  const [vw, setVw] = useState(() => window.innerWidth)
  const [vh, setVh] = useState(() => window.innerHeight)
  useEffect(() => {
    const fn = () => {
      setVw(window.innerWidth)
      setVh(window.innerHeight)
    }
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const diskPx = Math.min(720, vw)
  const translateY = Math.round(diskPx * 0.28)
  const arcRadius = Math.max(130, Math.round(diskPx * 0.45))
  const arcBottom = Math.max(80, diskPx - translateY - arcRadius - 20)
  const arcDeg = vw < 768 ? 105 : 75

  // Cards do carousel voam acima do container via transform (card central: y = -arcRadius - 60)
  const carouselContainerTop = vh - arcBottom - (arcRadius + 70)
  const carouselVisualTop = carouselContainerTop - (arcRadius + 60)
  const hintSpace = carouselVisualTop - 120 // 120px = searchbar bottom estimado
  const showHint = hintSpace >= 80

  return {
    translateY,
    arcRadius,
    arcBottom,
    arcDeg,
    showHint,
    hintTop: 120 + Math.max(0, hintSpace) / 2,
  }
}

export function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const playTrack = usePlayTrack()
  const recentlyPlayed = useRecentlyPlayed(50)
  const { arcRadius, arcBottom, arcDeg, showHint, hintTop } = useDiskLayout()
  const allTracks: SpotifyTrack[] = recentlyPlayed.data
    ? [...new Map(recentlyPlayed.data.map((i) => [i.track.id, i.track])).values()]
    : []
  const tracks = allTracks.slice(0, 5)

  const handleSearch = useCallback(
    (query: string, tab: SearchTab) => {
      if (query.trim()) navigate(`/artists?q=${encodeURIComponent(query)}&tab=${tab}`)
    },
    [navigate]
  )

  return (
    <div className="h-screen overflow-hidden relative">
      {/* SearchBar */}
      <div className="fixed top-14 left-0 right-0 z-20 flex justify-center px-4 pt-2">
        <SearchBar onSearch={handleSearch} className="shadow-sm" />
      </div>

      {/* Hint text — centralizado no espaço entre searchbar e carousel */}
      {showHint && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.7 }}
          className="fixed left-0 right-0 z-[4] flex justify-center px-8 pointer-events-none"
          style={{ top: hintTop }}
        >
          <p className="text-center text-[11px] text-black/30 leading-relaxed max-w-xs -translate-y-1/2">
            {t('login.hint')}
          </p>
        </motion.div>
      )}

      {/* Fixed arc carousel — disk is rendered by PersistentVinylDisk at root level */}
      <div className="fixed inset-0 pointer-events-none z-[5]">
        {/* Arc Carousel */}
        <div
          className="absolute left-1/2 pointer-events-auto"
          style={{ bottom: arcBottom, transform: 'translateX(-50%)' }}
        >
          {tracks.length > 0 && (
            <div className="relative">
              <ArcCarousel
                items={tracks.map((track) => ({
                  id: track.id,
                  content: <VinylCard track={track} onPlay={playTrack} size="sm" />,
                }))}
                radius={arcRadius}
                arcDeg={arcDeg}
                baseDelay={DISK_DONE_DELAY}
                title={t('home.recentlyPlayed')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
