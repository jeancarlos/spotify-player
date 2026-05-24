import { useState, useEffect, useId } from 'react'
import { motion } from 'framer-motion'
import { ArcCarousel } from '@/components/vinyl/ArcCarousel'
import { VinylCard } from '@/components/shared/VinylCard'
import type { SpotifyArtist, SpotifyTrack } from '@/types/spotify'

const CAROUSEL_DELAY = 0.3

function useArtistLayout() {
  const [vw, setVw] = useState(() => window.innerWidth)
  useEffect(() => {
    const fn = () => setVw(window.innerWidth)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const diskPx = Math.min(320, Math.round(vw * 0.75))
  const translateY = Math.round(diskPx * 0.15)
  const headerHeight = diskPx - translateY
  const arcRadius = Math.min(160, Math.max(100, Math.round(vw * 0.22)))
  const arcDeg = vw < 600 ? 120 : 100
  const arcContainerTop = headerHeight + 12
  const totalHeight = arcContainerTop + arcRadius + 70 + 48

  return { diskPx, translateY, headerHeight, arcRadius, arcDeg, arcContainerTop, totalHeight }
}

// side="left" é SVG 2.0 válido — coloca o texto no interior da curva,
// fazendo ele exibir curvando pra baixo (∩) em vez de pra cima (∪).
// Ausente dos tipos React, então usamos cast.
const arcSide = { side: 'left' } as unknown as React.SVGProps<SVGTextPathElement>

interface ArtistHeroSectionProps {
  artist: SpotifyArtist | undefined
  topTracks: SpotifyTrack[] | undefined
  activeTrackId?: string
  onTrackPlay: (track: SpotifyTrack) => void
  onLayout: (height: number) => void
  carouselTitle: string
}

export function ArtistHeroSection({
  artist,
  topTracks,
  activeTrackId,
  onTrackPlay,
  onLayout,
  carouselTitle,
}: ArtistHeroSectionProps) {
  const uid = useId()
  const { diskPx, translateY, headerHeight, arcRadius, arcDeg, arcContainerTop, totalHeight } =
    useArtistLayout()

  useEffect(() => {
    onLayout(totalHeight)
  }, [totalHeight, onLayout])

  const artistImage = artist?.images[0]?.url

  const cx = diskPx / 2
  const tR = diskPx / 2 + 24
  const arcHalf = (130 / 2) * (Math.PI / 180)
  const ax1 = cx - tR * Math.sin(arcHalf)
  const ay1 = cx + tR * Math.cos(arcHalf)
  const ax2 = cx + tR * Math.sin(arcHalf)
  const ay2 = cx + tR * Math.cos(arcHalf)
  const nameArcPath = `M ${ax1} ${ay1} A ${tR} ${tR} 0 0 1 ${ax2} ${ay2}`
  const nameFontSize = Math.max(13, Math.round(diskPx * 0.042))

  return (
    // fixed: fica colado no topo independente do scroll do container pai.
    // O conteúdo abaixo usa paddingTop = totalHeight via onLayout.
    <div
      className="fixed top-0 left-0 right-0 z-[5] pointer-events-none"
      style={{ height: totalHeight }}
    >
      {/* Disco — overflow:hidden corta a parte superior do círculo */}
      <div
        className="absolute top-0 left-0 right-0 overflow-hidden"
        style={{ height: headerHeight }}
      >
        <div
          className="absolute top-0 left-1/2"
          style={{ transform: `translateX(-50%) translateY(-${translateY}px)` }}
        >
          <motion.div
            initial={{ scale: 0.85, y: 60, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
            style={{ width: diskPx, height: diskPx, position: 'relative' }}
          >
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

            <motion.svg
              className="absolute inset-0 pointer-events-none overflow-visible"
              width={diskPx}
              height={diskPx}
              overflow="visible"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              <defs>
                <path id={`name-arc-${uid}`} d={nameArcPath} />
              </defs>
              <text fontFamily="Inter, sans-serif" fontWeight="900" letterSpacing="3.5">
                <textPath
                  {...arcSide}
                  href={`#name-arc-${uid}`}
                  startOffset="50%"
                  textAnchor="middle"
                  style={{ fontSize: nameFontSize }}
                  fill="rgba(0,0,0,0.82)"
                >
                  {artist?.name?.toUpperCase() ?? ''}
                </textPath>
              </text>
            </motion.svg>
          </motion.div>
        </div>
      </div>

      {/* ArcCarousel de top 5 — abaixo do disco */}
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
            baseDelay={CAROUSEL_DELAY}
            title={carouselTitle}
            inverted
          />
        )}
      </div>
    </div>
  )
}
