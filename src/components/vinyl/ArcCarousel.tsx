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
  inverted?: boolean
}

export function ArcCarousel({
  items,
  radius = 300,
  arcDeg = 150,
  offsetDeg = 0,
  baseDelay = 0,
  title,
  inverted = false,
}: ArcCarouselProps) {
  const uid = useId()
  const positions = calcArcPositions(items.length, radius + 70, arcDeg, offsetDeg)

  // Arc text path — top arc (normal) or bottom arc (inverted)
  const cx = radius
  const tR = radius + 46
  const halfRad = ((arcDeg / 2) * Math.PI) / 180
  const x1 = cx - tR * Math.sin(halfRad)
  const x2 = cx + tR * Math.sin(halfRad)

  // Normal: arc curves upward above the container (cy = R+70, text at cy - tR*cos)
  // Inverted: arc curves downward below the container (cy = 0, text at cy + tR*cos)
  const arcPath = inverted
    ? `M ${x1} ${tR * Math.cos(halfRad)} A ${tR} ${tR} 0 0 0 ${x2} ${tR * Math.cos(halfRad)}`
    : `M ${x1} ${radius + 70 - tR * Math.cos(halfRad)} A ${tR} ${tR} 0 0 1 ${x2} ${radius + 70 - tR * Math.cos(halfRad)}`

  return (
    <div className="relative" style={{ width: radius * 2, height: radius + 70 }}>
      <div className="absolute inset-0 flex items-end justify-center">
        <AnimatePresence mode="popLayout">
          {items.map((item, i) => {
            const pos = positions[i]
            if (!pos) return null

            // Normal: cards fly upward (pos.y is negative)
            // Inverted: cards hang downward (negate pos.y)
            const animY = inverted ? -pos.y + 60 : pos.y + 40

            return (
              <motion.div
                key={item.id}
                className="absolute"
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                animate={{ x: pos.x, y: animY, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.2 } }}
                transition={{
                  type: 'spring',
                  stiffness: 220,
                  damping: 22,
                  delay: baseDelay + i * 0.06,
                }}
                style={{ rotate: inverted ? -pos.tilt : pos.tilt }}
              >
                {item.content}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {title && (
        <motion.svg
          className={
            inverted
              ? 'absolute bottom-[-120px] inset-x-0 pointer-events-none'
              : 'absolute top-[-120px] inset-0 pointer-events-none'
          }
          width={radius * 2}
          height={radius + 120}
          style={{ overflow: 'visible' }}
          overflow="visible"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: baseDelay + items.length * 0.06 + 0.3,
            duration: 0.6,
            ease: 'easeOut',
          }}
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
    </div>
  )
}
