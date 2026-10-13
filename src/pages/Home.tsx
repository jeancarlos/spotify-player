import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useRecentlyPlayed } from '@/hooks/useRecentlyPlayed'
import { useCatalogHealth } from '@/hooks/useCatalogHealth'
import { usePlayer } from '@/contexts/PlayerContext'
import { ArcCarousel } from '@/components/vinyl/ArcCarousel'
import { VinylCard } from '@/components/shared/VinylCard'
import { SearchBar } from '@/components/shared/SearchBar'
import type { SearchTab } from '@/utils/search'

const DISK_ENTRY_DELAY_S = 0.75
const MAX_CAROUSEL_TRACKS = 5

function useDiskLayout() {
  const [vw, setVw] = useState(() => window.innerWidth)
  const [vh, setVh] = useState(() => window.innerHeight)
  useEffect(() => {
    const handleResize = () => {
      setVw(window.innerWidth)
      setVh(window.innerHeight)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const diskPx = Math.min(720, vw)
  const translateY = Math.round(diskPx * 0.28)
  const arcRadius = Math.max(130, Math.round(diskPx * 0.45))
  const arcBottom = Math.max(80, diskPx - translateY - arcRadius - (vw < 768 ? 0 : 20))
  const arcDeg = vw < 768 ? 90 : 75

  const carouselContainerTop = vh - arcBottom - (arcRadius + 70)
  const carouselVisualTop = carouselContainerTop - (arcRadius + 60)
  const hintSpace = carouselVisualTop - 120
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
  const { controls } = usePlayer()
  const recentlyPlayed = useRecentlyPlayed(10)
  const { unavailable } = useCatalogHealth()
  const { arcRadius, arcBottom, arcDeg, showHint, hintTop } = useDiskLayout()

  const tracks = recentlyPlayed.data.slice(0, MAX_CAROUSEL_TRACKS)

  const handleSearch = useCallback(
    (query: string, tab: SearchTab) => {
      if (query.trim()) navigate(`/artists?q=${encodeURIComponent(query)}&tab=${tab}`)
    },
    [navigate]
  )

  const renderCarouselContent = () => {
    if (tracks.length === 0) {
      return <p className="text-center text-xs text-black/20 mb-12">{t('artists.searchPrompt')}</p>
    }
    return (
      <div className="relative">
        <ArcCarousel
          items={tracks.map((track) => ({
            id: track.id,
            content: <VinylCard track={track} onPlay={unavailable ? undefined : async (track) => controls.playTrack(track, tracks)} size="sm" />,
          }))}
          radius={arcRadius}
          arcDeg={arcDeg}
          baseDelay={DISK_ENTRY_DELAY_S}
          title={t('home.recentlyPlayed')}
        />
      </div>
    )
  }

  return (
    <div className="h-screen overflow-hidden relative">
      <div className="fixed top-14 left-0 right-0 z-20 flex justify-center px-4 pt-2">
        <SearchBar onSearch={handleSearch} className="shadow-sm" />
      </div>

      {showHint && tracks.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.7 }}
          className="fixed left-0 right-0 z-[4] flex justify-center px-8 pointer-events-none"
          style={{ top: hintTop }}
        >
          <p className="text-center text-[12px] text-black/30 leading-relaxed max-w-xs">
            {t('home.hint')}
          </p>
        </motion.div>
      )}

      <div className="fixed inset-0 pointer-events-none z-[5]">
        <div
          className="absolute left-1/2 pointer-events-auto"
          style={{ bottom: arcBottom, transform: 'translateX(-50%)' }}
        >
          {renderCarouselContent()}
        </div>
      </div>
    </div>
  )
}
