import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TiltCoverProps {
  imageUrl?: string
  size: number
  name?: string
  onClick?: () => void
  className?: string
  children?: React.ReactNode
}

const TILT = 12

export function TiltCover({ imageUrl, size, name, onClick, className, children }: TiltCoverProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const rotX = useMotionValue(0)
  const rotY = useMotionValue(0)
  const liftY = useMotionValue(0)
  const scaleV = useMotionValue(1)

  const springRotX = useSpring(rotX, { stiffness: 180, damping: 22 })
  const springRotY = useSpring(rotY, { stiffness: 180, damping: 22 })
  const springLiftY = useSpring(liftY, { stiffness: 180, damping: 22 })
  const springScale = useSpring(scaleV, { stiffness: 180, damping: 22 })

  function handleMouseEnter() {
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
    rotX.set(0)
    rotY.set(0)
    liftY.set(0)
    scaleV.set(1)
  }

  return (
    <div
      className={cn('relative select-none shrink-0 group', className)}
      style={{ width: size, height: size, perspective: '1200px' }}
    >
      <motion.div
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        onKeyDown={
          onClick
            ? (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') onClick()
              }
            : undefined
        }
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        style={{
          width: size,
          height: size,
          rotateX: springRotX,
          rotateY: springRotY,
          y: springLiftY,
          scale: springScale,
          borderRadius: '0.75rem',
          overflow: 'hidden',
        }}
        whileTap={onClick ? { scale: 0.97 } : undefined}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name ?? ''}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-black/10 flex items-center justify-center">
            <span className="text-5xl text-black/20">♪</span>
          </div>
        )}
        {children}
      </motion.div>
    </div>
  )
}
