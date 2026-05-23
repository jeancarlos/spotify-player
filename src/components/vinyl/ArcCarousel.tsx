import { useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { calcArcPositions } from '@/utils/arcAngles'

interface ArcItem {
  id: string
  content: React.ReactNode
}

interface ArcCarouselProps {
  items: ArcItem[]
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

  // Arc text path logic
  const cx = radius
  const cy = radius + 70
  const tR = radius + 46
  const halfRad = ((arcDeg / 2) * Math.PI) / 180
  const x1 = cx - tR * Math.sin(halfRad)
  const y1 = cy - tR * Math.cos(halfRad)
  const x2 = cx + tR * Math.sin(halfRad)
  const y2 = y1
  const arcPath = `M ${x1} ${y1} A ${tR} ${tR} 0 0 1 ${x2} ${y2}`

  return (
    <div className="relative" style={{ width: radius * 2, height: radius + 70 }}>
      <div className="absolute inset-0 flex items-end justify-center">
        <AnimatePresence mode="popLayout">
          {items.map((item, i) => {
            const pos = positions[i]
            if (!pos) return null

            return (
              <motion.div
                key={item.id}
                className="absolute"
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                animate={{
                  x: pos.x,
                  y: pos.y - 60,
                  opacity: 1,
                  scale: 1,
                }}
                exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.2 } }}
                transition={{
                  type: 'spring',
                  stiffness: 220,
                  damping: 22,
                  delay: baseDelay + i * 0.06,
                }}
                style={{ rotate: pos.tilt }}
              >
                {item.content}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {title && (
        <motion.svg
          className="absolute top-[-120px] inset-0 pointer-events-none"
          width={radius * 2}
          height={radius + 120}
          style={{ overflow: 'visible' }}
          overflow="visible"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: baseDelay + items.length * 0.06 + 0.3, duration: 0.6, ease: 'easeOut' }}
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
        </motion.svg>
      )}
    </div >
  )
}
