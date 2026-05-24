import { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'

interface ArtistHeaderProps {
  imageUrl: string | undefined
  name: string
  subtitle?: string
  onLayout: (height: number) => void
}

function useArtistHeaderLayout() {
  const [vw, setVw] = useState(() => window.innerWidth)
  useEffect(() => {
    const fn = () => { setVw(window.innerWidth); }
    window.addEventListener('resize', fn)
    return () => { window.removeEventListener('resize', fn); }
  }, [])

  const imgPx = Math.min(280, Math.round(vw * 0.65))
  const headerHeight = Math.round(imgPx * 0.75) + 120

  return { imgPx, headerHeight }
}

export function ArtistHeader({ imageUrl, name, subtitle, onLayout }: ArtistHeaderProps) {
  const { imgPx, headerHeight } = useArtistHeaderLayout()

  const scrollY = useMotionValue(0)
  const opacity = useTransform(scrollY, [0, headerHeight * 0.65], [1, 0])

  useEffect(() => {
    onLayout(headerHeight)
  }, [headerHeight, onLayout])

  useEffect(() => {
    const el = document.getElementById('main-content')
    if (!el) return
    const fn = () => { scrollY.set(el.scrollTop); }
    el.addEventListener('scroll', fn, { passive: true })
    return () => { el.removeEventListener('scroll', fn); }
  }, [scrollY])

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 pointer-events-none"
      style={{ height: headerHeight, opacity, zIndex: 5 }}
    >
      <div
        className="absolute left-1/2"
        style={{ transform: 'translateX(-50%) translateY(-16px)', top: 0, zIndex: 2 }}
      >
        <motion.div
          initial={{ scale: 0.8, y: 60, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          style={{ width: imgPx, height: imgPx }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover rounded-full shadow-xl"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full rounded-full bg-black/10" />
          )}
        </motion.div>
      </div>

      {imageUrl && (
        <motion.img
          src={imageUrl}
          aria-hidden="true"
          alt={name}
          className="absolute left-0 right-0 top-[-100px] h-[500px]  sepia-[.25] scale-125 opacity-10 w-full blur-3xl z-0"
          draggable={false}
          animate={{ opacity: 0.1 }}
          initial={{ opacity: 0, scale: 1 }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
        />
      )}

      <motion.div
        className="absolute left-0 right-0 flex flex-col items-center"
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
        {subtitle && <p className="text-sm text-black/50 mt-1 text-center px-8">{subtitle}</p>}
      </motion.div>
    </motion.div>
  )
}
