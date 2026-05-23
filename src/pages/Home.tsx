import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRecentlyPlayed } from '@/hooks/queries/useRecentlyPlayed'
import { usePlayer } from '@/hooks/usePlayer'
import { usePlayTrack } from '@/hooks/usePlayTrack'
import { VinylDisk } from '@/components/vinyl/VinylDisk'
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
    const fn = () => { setVw(window.innerWidth); setVh(window.innerHeight) }
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const diskPx = Math.min(720, vw)
  const translateY = Math.round(diskPx * 0.28)
  const arcRadius = Math.max(130, Math.round(diskPx * 0.36))
  const arcBottom = Math.max(80, diskPx - translateY - arcRadius - 20)
  const arcDeg = vw < 768 ? 130 : 90

  // Cards do carousel voam acima do container via transform (card central: y = -arcRadius - 60)
  const carouselContainerTop = vh - arcBottom - (arcRadius + 70)
  const carouselVisualTop = carouselContainerTop - (arcRadius + 60)
  const hintSpace = carouselVisualTop - 120  // 120px = searchbar bottom estimado
  const showHint = hintSpace >= 80

  return { translateY, arcRadius, arcBottom, arcDeg, showHint, hintTop: 120 + Math.max(0, hintSpace) / 2 }
}

export function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state } = usePlayer()
  const playTrack = usePlayTrack()
  const recentlyPlayed = useRecentlyPlayed(50)
  const { translateY, arcRadius, arcBottom, arcDeg, showHint, hintTop } = useDiskLayout()
  const [offset, setOffset] = useState(0)

  const allTracks: SpotifyTrack[] = recentlyPlayed.data
    ? [...new Map(recentlyPlayed.data.map(i => [i.track.id, i.track])).values()]
    : []
  const tracks = allTracks.slice(offset, offset + 5)
  const canPrev = offset > 0
  const canNext = offset + 5 < allTracks.length
  const hasNav = allTracks.length > 5

  const handleSearch = useCallback((query: string, tab: SearchTab) => {
    if (query.trim()) navigate(`/artists?q=${encodeURIComponent(query)}&tab=${tab}`)
  }, [navigate])

  const albumArt = state.currentTrack?.album.images[0]?.url

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

      {/* Mobile semi-circle nav buttons — fixed to screen edges */}
      {hasNav && (
        <>
          <button
            onClick={() => setOffset(o => Math.max(0, o - 1))}
            disabled={!canPrev}
            className="md:hidden fixed left-0 bottom-24 z-10 w-10 h-20 rounded-r-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center pl-1 disabled:opacity-0 disabled:pointer-events-none transition-opacity"
            aria-label={t('artists.previous')}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setOffset(o => o + 1)}
            disabled={!canNext}
            className="md:hidden fixed right-0 bottom-24 z-10 w-10 h-20 rounded-l-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center pr-1 disabled:opacity-0 disabled:pointer-events-none transition-opacity"
            aria-label={t('artists.next')}
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* Fixed vinyl + arc */}
      <div className="fixed inset-0 pointer-events-none z-[5]">
        {/* VinylDisk — rendered first so carousel SVG text paints above it */}
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

        {/* Arc Carousel — rendered after disk so it (and its SVG title) paints above */}
        <div
          className="absolute left-1/2 pointer-events-auto"
          style={{ bottom: arcBottom, transform: 'translateX(-50%)' }}
        >
          {tracks.length > 0 && (
            <div className="relative">
              {/* Desktop side buttons */}
              {hasNav && (
                <>
                  <button
                    onClick={() => setOffset(o => Math.max(0, o - 1))}
                    disabled={!canPrev}
                    className="hidden md:flex absolute bottom-10 -left-10 p-2 rounded-full bg-black/40 text-white disabled:opacity-20 transition-opacity items-center justify-center"
                    aria-label={t('artists.previous')}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setOffset(o => o + 1)}
                    disabled={!canNext}
                    className="hidden md:flex absolute bottom-10 -right-10 p-2 rounded-full bg-black/40 text-white disabled:opacity-20 transition-opacity items-center justify-center"
                    aria-label={t('artists.next')}
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
              <ArcCarousel
                items={tracks.map(track => ({
                  id: track.id,
                  content: (
                    <VinylCard
                      track={track}
                      isActive={state.currentTrack?.id === track.id}
                      onPlay={playTrack}
                      size="sm"
                    />
                  ),
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
