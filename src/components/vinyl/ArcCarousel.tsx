import { useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface ArcPosition {
  x: number
  y: number
  tilt: number
}

export function calcArcPositions(
  count: number,
  radius: number,
  arcDeg: number,
  offsetDeg: number
): ArcPosition[] {
  if (count === 0) return []

  const half = arcDeg / 2
  const step = count > 1 ? arcDeg / (count - 1) : 0
  const startDeg = count > 1 ? -half : 0

  return Array.from({ length: count }, (_, i) => {
    const angleDeg = startDeg + step * i + offsetDeg
    const rad = (angleDeg * Math.PI) / 180
    return {
      x: Math.sin(rad) * radius,
      y: -Math.cos(rad) * radius,
      tilt: angleDeg * 0.25,
    }
  })
}

interface ArcCarouselProps {
  items: React.ReactNode[]
  radius?: number
  arcDeg?: number
  offsetDeg?: number
  baseDelay?: number
  title?: string
}

export function ArcCarousel({
  items,
  radius = 300,
  arcDeg = 150,
  offsetDeg = 0,
  baseDelay = 0,
  title,
}: ArcCarouselProps) {
  const uid = useId()
  const positions = calcArcPositions(items.length, radius, arcDeg, offsetDeg)

  // Arc text path: circle origin at bottom-center of container
  // tR sits above the card arc so the label floats over the items
  const cx = radius
  const cy = radius + 120
  const tR = radius + 72
  const halfRad = ((arcDeg / 2) * Math.PI) / 180
  const x1 = cx - tR * Math.sin(halfRad)
  const y1 = cy - tR * Math.cos(halfRad)
  const x2 = cx + tR * Math.sin(halfRad)
  const y2 = y1
  const arcPath = `M ${x1} ${y1} A ${tR} ${tR} 0 0 1 ${x2} ${y2}`

  return (
    <div className="relative" style={{ width: radius * 2, height: radius + 120 }}>
      <div className="absolute inset-0 flex items-end justify-center">
        <AnimatePresence mode="sync">
          {items.map((item, i) => {
            const pos = positions[i]
            return (
              <motion.div
                key={i}
                className="absolute"
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                animate={{
                  x: pos.x,
                  y: pos.y - 60,
                  opacity: 1,
                  scale: 1,
                }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{
                  type: 'spring',
                  stiffness: 220,
                  damping: 22,
                  delay: baseDelay + i * 0.06,
                }}
                style={{ rotate: pos.tilt }}
              >
                {item}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {title && (
        <svg
          className="absolute inset-0 pointer-events-none"
          width={radius * 2}
          height={radius + 120}
          style={{ overflow: 'visible' }}
          overflow="visible"
        >
          <defs>
            <path id={`arc-${uid}`} d={arcPath} />
          </defs>
          <text
            fontSize="11"
            fill="rgba(0,0,0,0.4)"
            fontWeight="600"
            letterSpacing="1.5"
            fontFamily="monospace"
          >
            <textPath href={`#arc-${uid}`} startOffset="50%" textAnchor="middle">
              {title.toUpperCase()}
            </textPath>
          </text>
        </svg>
      )}
    </div>
  )
}
