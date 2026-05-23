import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollectionHeaderProps {
  imageUrl: string | undefined
  name: string
  subtitle: string
  year?: string
  playLabel: string
  onPlay: () => void
  onBack: () => void
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
  // visible image height + name block (~100px) + button (~52px) + padding (32px)
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
  onBack,
  onLayout,
}: CollectionHeaderProps) {
  const { imgPx, translateY, headerHeight } = useCollectionLayout()

  useEffect(() => {
    onLayout(headerHeight)
  }, [headerHeight, onLayout])

  return (
    <div className="fixed inset-x-0 top-0 z-[5] pointer-events-none">
      {/* Botão voltar */}
      <button
        onClick={onBack}
        className="pointer-events-auto absolute top-4 left-4 flex items-center gap-1 text-sm font-medium text-black/60 hover:text-black transition-colors z-10 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full"
      >
        <ChevronLeft size={16} />
        Voltar
      </button>

      {/* Imagem saindo do topo */}
      <div
        className="absolute left-1/2"
        style={{ transform: `translateX(-50%) translateY(-${translateY}px)`, top: 0 }}
      >
        <motion.div
          initial={{ scale: 0.8, y: 60, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="object-cover shadow-2xl"
              style={{
                width: imgPx,
                height: imgPx,
                borderRadius: imgPx * 0.12,
              }}
              draggable={false}
            />
          ) : (
            <div
              className="bg-black/10 flex items-center justify-center"
              style={{ width: imgPx, height: imgPx, borderRadius: imgPx * 0.12 }}
            >
              <span className="text-5xl text-black/20">♪</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Metadados + botão */}
      <motion.div
        className="absolute left-0 right-0 flex flex-col items-center pointer-events-auto"
        style={{ top: imgPx - translateY + 16 }}
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
