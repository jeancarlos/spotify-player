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
}

export function ArcCarousel({
  items,
  radius = 300,
  arcDeg = 150,
  offsetDeg = 0,
}: ArcCarouselProps) {
  const positions = calcArcPositions(items.length, radius, arcDeg, offsetDeg)

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
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: pos.x,
                  y: pos.y - 60,
                }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24, delay: i * 0.04 }}
                style={{ rotate: pos.tilt }}
              >
                {item}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
