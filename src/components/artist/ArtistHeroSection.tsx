import { useState, useEffect, useId } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { ArcCarousel } from '@/components/vinyl/ArcCarousel'
import { VinylCard } from '@/components/shared/VinylCard'
import type { SpotifyArtist, SpotifyTrack } from '@/types/spotify'

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
  const fixedZoneHeight = arcContainerTop + arcRadius + 60 + 80

  return { diskPx, translateY, arcRadius, arcDeg, arcContainerTop, fixedZoneHeight }
}

interface ArtistHeroSectionProps {
  artist: SpotifyArtist | undefined
  topTracks: SpotifyTrack[] | undefined
  activeTrackId?: string
  onTrackPlay: (track: SpotifyTrack) => void
  onBack: () => void
  onLayout: (fixedZoneHeight: number) => void
  carouselTitle: string
}

export function ArtistHeroSection({
  artist,
  topTracks,
  activeTrackId,
  onTrackPlay,
  onBack,
  onLayout,
  carouselTitle,
}: ArtistHeroSectionProps) {
  const uid = useId()
  const { diskPx, translateY, arcRadius, arcDeg, arcContainerTop, fixedZoneHeight } = useArtistLayout()

  useEffect(() => {
    onLayout(fixedZoneHeight)
  }, [fixedZoneHeight, onLayout])

  const artistImage = artist?.images[0]?.url

  // Arc text path around the bottom of the artist photo
  const cx = diskPx / 2
  const tR = diskPx / 2 + 32
  const arcHalf = (120 / 2) * (Math.PI / 180) // 120° arc, centered at bottom
  const ax1 = cx - tR * Math.sin(arcHalf)
  const ay1 = cx + tR * Math.cos(arcHalf)
  const ax2 = cx + tR * Math.sin(arcHalf)
  const ay2 = cx + tR * Math.cos(arcHalf)
  const nameArcPath = `M ${ax1} ${ay1} A ${tR} ${tR} 0 0 1 ${ax2} ${ay2}`

  const backBtnViewportX = (window.innerWidth - diskPx) / 2 + ax1
  const backBtnViewportY = ay1 - translateY

  return (
    <div className="fixed inset-0 pointer-events-none z-[5]">
      {/* Botão voltar */}
      <motion.button
        onClick={onBack}
        className="pointer-events-auto absolute flex items-center justify-center w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm text-black/60 hover:text-black hover:bg-white/90 transition-all shadow-sm"
        style={{ left: Math.max(16, backBtnViewportX - 16), top: Math.max(16, backBtnViewportY - 16) }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
        aria-label="Voltar"
      >
        <ChevronLeft size={16} />
      </motion.button>

      {/* Foto circular do artista saindo do topo */}
      <div
        className="absolute top-0 left-1/2"
        style={{ transform: `translateX(-50%) translateY(-${translateY}px)` }}
      >
        <motion.div
          initial={{ scale: 0.7, y: 80, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
          style={{ width: diskPx, height: diskPx, position: 'relative' }}
        >
          {/* Foto do artista */}
          {artistImage ? (
            <img
              src={artistImage}
              alt={artist?.name}
              className="rounded-full object-cover w-full h-full"
              draggable={false}
            />
          ) : (
            <div className="rounded-full w-full h-full bg-black/10" />
          )}

          {/* Nome em arco SVG */}
          <motion.svg
            className="absolute inset-0 pointer-events-none overflow-visible"
            width={diskPx}
            height={diskPx}
            overflow="visible"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <defs>
              <path id={`name-arc-${uid}`} d={nameArcPath} />
            </defs>
            <text
              fontFamily="Inter, sans-serif"
              fontWeight="900"
              letterSpacing="3"
            >
              <textPath
                href={`#name-arc-${uid}`}
                startOffset="50%"
                textAnchor="middle"
                style={{ fontSize: Math.max(14, diskPx * 0.035) }}
                fill="rgba(0,0,0,0.85)"
              >
                {artist?.name?.toUpperCase() ?? ''}
              </textPath>
            </text>
          </motion.svg>
        </motion.div>
      </div>

      {/* ArcCarousel de top 5 */}
      <div
        className="absolute left-1/2 pointer-events-auto"
        style={{ top: arcContainerTop, transform: 'translateX(-50%)' }}
      >
        {topTracks && topTracks.length > 0 && (
          <ArcCarousel
            items={topTracks.slice(0, 5).map((track, i) => ({
              id: track.id,
              content: (
                <div className="flex flex-col items-center gap-1">
                  <VinylCard
                    track={track}
                    isActive={activeTrackId === track.id}
                    onPlay={onTrackPlay}
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
            title={carouselTitle}
            inverted
          />
        )}
      </div>
    </div>
  )
}
