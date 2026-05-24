import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FlippableCover } from './FlippableCover'

interface CollectionHeaderProps {
  imageUrl: string | undefined
  backUrl?: string | null
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
  backUrl,
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

  return (
    <div className="">
      <div
        className="absolute left-1/2"
        style={{ transform: 'translateX(-50%) translateY(-16px)', top: 0 }}
      >
        <motion.div
          initial={{ scale: 0.8, y: 60, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          style={{ zIndex: 2, position: 'relative' }}
        >
          <FlippableCover
            frontUrl={imageUrl}
            backUrl={backUrl}
            size={imgPx}
            name={name}
            onClick={onPlay}
          >
            <div className={cn(
              'absolute inset-0 rounded-xl flex items-center justify-center',
              'bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200',
            )}>
              <Play size={48} fill="white" color="white" className="drop-shadow-lg" />
            </div>
          </FlippableCover>
        </motion.div>
      </div>

      <motion.div
        className="absolute left-0 right-0 flex flex-col items-center pointer-events-auto"
        style={{ top: imgPx, zIndex: 1 }}
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
            'hover:bg-black/80 active:scale-95 transition-all shadow-lg',
          )}
        >
          {playLabel}
        </button>
      </motion.div>
    </div>
  )
}
