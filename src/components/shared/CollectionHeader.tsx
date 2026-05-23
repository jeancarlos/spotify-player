import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollectionHeaderProps {
  imageUrl: string | undefined
  name: string
  subtitle: string
  year?: string
  playLabel: string
  onPlay: () => void
  onLayout: (height: number) => void
  className?: string
}

function useCollectionLayout() {
  const [vw, setVw] = useState(() => window.innerWidth)
  useEffect(() => {
    const fn = () => setVw(window.innerWidth)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const imgPx = Math.min(280, Math.round(vw * 0.65))
  const translateY = Math.round(imgPx * 0.25)
  const headerHeight = imgPx - translateY + 184

  return { imgPx, translateY, headerHeight }
}

export function CollectionHeader({
  imageUrl,
  name,
  subtitle,
  year,
  playLabel,
  onPlay,
  onLayout,
}: CollectionHeaderProps) {
  const { imgPx, headerHeight } = useCollectionLayout()

  useEffect(() => {
    onLayout(headerHeight)
  }, [headerHeight, onLayout])

  const cardRef = useRef<HTMLButtonElement>(null)
  const TILT = 14

  const rotX = useMotionValue(0)
  const rotY = useMotionValue(0)
  const liftY = useMotionValue(0)

  const springRotX = useSpring(rotX, { stiffness: 180, damping: 22 })
  const springRotY = useSpring(rotY, { stiffness: 180, damping: 22 })
  const springLiftY = useSpring(liftY, { stiffness: 180, damping: 22 })

  function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = (e.clientX - rect.left) / rect.width   // 0→1
    const py = (e.clientY - rect.top) / rect.height   // 0→1
    rotY.set((px - 0.5) * TILT * 2)
    rotX.set((0.5 - py) * TILT * 2)
    liftY.set(-10)
  }

  function handleMouseLeave() {
    rotX.set(0)
    rotY.set(0)
    liftY.set(0)
  }

  return (
    <div className="">
      {/* Imagem saindo do topo */}
      <div
        className="absolute left-1/2"
        style={{ transform: `translateX(-50%) translateY(-16px)`, top: 0, perspective: '800px' }}
      >
        {/* wrapper só para entry animation — não anima y para não brigar com springLiftY */}
        <motion.div
          initial={{ scale: 0.8, y: 60, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
        <motion.button
          ref={cardRef}
          onClick={onPlay}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="group relative block cursor-pointer focus:outline-none overflow-hidden rounded-2xl"
          whileTap={{ scale: 0.97 }}
          style={{
            width: imgPx,
            height: imgPx,
            rotateX: springRotX,
            rotateY: springRotY,
            y: springLiftY,
            transformStyle: 'preserve-3d',
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="object-cover rounded-xl w-full h-full transition-shadow duration-200 group-hover:shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
              style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.28)' }}
              draggable={false}
            />
          ) : (
            <div
              className="bg-black/10 flex items-center justify-center w-full h-full rounded-xl"
            >
              <span className="text-5xl text-black/20">♪</span>
            </div>
          )}
          {/* overlay play */}
          <div className={cn(
            'absolute inset-0 rounded-xl flex items-center justify-center',
            'bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200'
          )}>
            <Play size={48} fill="white" color="white" className="drop-shadow-lg" />
          </div>
        </motion.button>
        </motion.div>
      </div>

      {/* Metadados + botão */}
      <motion.div
        className="absolute left-0 right-0 flex flex-col items-center pointer-events-auto"
        style={{ top: imgPx }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <h1
          className="text-2xl font-black text-black text-center px-8 leading-tight"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {name}
        </h1>
        <p className="text-sm text-black/50 mt-1">
          {subtitle}{year ? ` · ${year}` : ''}
        </p>
        <button
          onClick={onPlay}
          className={cn(
            'mt-4 px-8 py-3 bg-black text-white text-sm font-bold rounded-full',
            'hover:bg-black/80 active:scale-95 transition-all shadow-lg'
          )}
        >
          {playLabel}
        </button>
      </motion.div>
    </div>
  )
}
