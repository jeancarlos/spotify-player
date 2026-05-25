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
  const playTrack = usePlayTrack()
  const recentlyPlayed = useRecentlyPlayed(10)
  const { arcRadius, arcBottom, arcDeg, showHint, hintTop } = useDiskLayout()

  const isLoading = recentlyPlayed.isPending
  const isError = recentlyPlayed.isError

  const uniqueTracks: SpotifyTrack[] = recentlyPlayed.data
    ? [
        ...new Map(
          recentlyPlayed.data.map((playedItem) => [playedItem.track.id, playedItem.track])
        ).values(),
      ]
    : []
  const tracks = uniqueTracks.slice(0, MAX_CAROUSEL_TRACKS)

  const handleSearch = useCallback(
    (query: string, tab: SearchTab) => {
      if (query.trim()) navigate(`/artists?q=${encodeURIComponent(query)}&tab=${tab}`)
    },
    [navigate]
  )

  const renderCarouselContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center mb-12">
          <div className="w-6 h-6 border-2 border-black/10 rounded-full border-t-black/30 animate-spin" />
        </div>
      )
    }
    if (isError) {
      return <p className="text-center text-xs text-black/20 mb-12">{t('common.error')}</p>
    }
    if (tracks.length === 0) {
      return <p className="text-center text-xs text-black/20 mb-12">{t('artists.searchPrompt')}</p>
    }
    return (
      <div className="relative">
        <ArcCarousel
          items={tracks.map((track) => ({
            id: track.id,
            content: <VinylCard track={track} onPlay={playTrack} size="sm" />,
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

      {showHint && !isLoading && tracks.length > 0 && (
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
