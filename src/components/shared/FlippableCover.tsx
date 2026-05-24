import { useState, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface FlippableCoverProps {
  frontUrl?: string
  backUrl?: string | null
  size: number
  name?: string
  onClick?: () => void
  className?: string
  children?: React.ReactNode
}

const TILT = 12

export function FlippableCover({
  frontUrl,
  backUrl,
  size,
  name,
  onClick,
  className,
  children,
}: FlippableCoverProps) {
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const hasBack = !!backUrl

  const rotX = useMotionValue(0)
  const rotY = useMotionValue(0)
  const liftY = useMotionValue(0)
  const scaleV = useMotionValue(1)

  const springRotX = useSpring(rotX, { stiffness: 180, damping: 22 })
  const springRotY = useSpring(rotY, { stiffness: 180, damping: 22 })
  const springLiftY = useSpring(liftY, { stiffness: 180, damping: 22 })
  const springScale = useSpring(scaleV, { stiffness: 180, damping: 22 })

  function handleMouseEnter() {
    setIsHovered(true)
    liftY.set(24)
    scaleV.set(1.06)
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    rotY.set((px - 0.5) * TILT * 2)
    rotX.set((0.5 - py) * TILT * 2)
  }

  function handleMouseLeave() {
    setIsHovered(false)
    rotX.set(0)
    rotY.set(0)
    liftY.set(0)
    scaleV.set(1)
  }

  const frontContent = frontUrl ? (
    <img src={frontUrl} alt={name ?? ''} className="w-full h-full object-cover" draggable={false} />
  ) : (
    <div className="w-full h-full bg-black/10 flex items-center justify-center">
      <span className="text-5xl text-black/20">♪</span>
    </div>
  )

  return (
    <div
      className={cn('relative select-none shrink-0 group', className)}
      style={{
        width: size,
        height: size,
        perspective: '1200px',
      }}
    >
      <motion.div
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        onKeyDown={onClick ? (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') onClick()
        } : undefined}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        style={{
          width: size,
          height: size,
          rotateX: springRotX,
          rotateY: springRotY,
          y: springLiftY,
          scale: springScale,
          transformStyle: 'preserve-3d',
          position: 'relative',
          zIndex: isHovered ? 10 : 0,
          borderRadius: '0.75rem',
        }}
        animate={{
          boxShadow: isHovered
            ? '0 24px 60px rgba(0,0,0,0.45)'
            : '0 12px 40px rgba(0,0,0,0.28)',
        }}
        transition={{ boxShadow: { duration: 0.2 } }}
        whileTap={onClick ? { scale: 0.97 } : undefined}
      >
        {hasBack ? (
          <motion.div
            style={{
              width: '100%',
              height: '100%',
              transformStyle: 'preserve-3d',
              position: 'relative',
            }}
            animate={{ rotateY: isHovered ? 180 : 0 }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Frente */}
            <div
              className="absolute inset-0 rounded-xl overflow-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              {frontContent}
              {children}
            </div>
            {/* Verso */}
            <div
              className="absolute inset-0 rounded-xl overflow-hidden"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <img
                src={backUrl}
                alt={name ? `${name} - verso` : 'verso'}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          </motion.div>
        ) : (
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            {frontContent}
            {children}
          </div>
        )}
      </motion.div>
    </div>
  )
}
