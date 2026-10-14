import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { pickImage, srcSetOf } from '@/lib/utils'
import type { Image } from '@/types/music'
import { DeezerAttribution } from '@/components/shared/DeezerAttribution'

interface ArtistHeaderProps {
  images: Image[]
  name: string
  subtitle?: string
  link?: string
  onLayout: (height: number) => void
}

function useArtistHeaderLayout(hasLink: boolean) {
  const [vw, setVw] = useState(() => window.innerWidth)
  useEffect(() => {
    const fn = () => {
      setVw(window.innerWidth)
    }
    window.addEventListener('resize', fn)
    return () => {
      window.removeEventListener('resize', fn)
    }
  }, [])

  const imgPx = Math.min(280, Math.round(vw * 0.65))
  const headerHeight = Math.round(imgPx * 0.75) + 120 + (hasLink ? 28 : 0)

  return { imgPx, headerHeight }
}

export function ArtistHeader({ images, name, subtitle, link, onLayout }: ArtistHeaderProps) {
  const { t } = useTranslation()
  const { imgPx, headerHeight } = useArtistHeaderLayout(!!link)

  const scrollY = useMotionValue(0)
  const opacity = useTransform(scrollY, [0, headerHeight * 0.65], [1, 0])

  const lastHeight = useRef<number>(0)
  useEffect(() => {
    if (headerHeight !== lastHeight.current) {
      lastHeight.current = headerHeight
      onLayout(headerHeight)
    }
  }, [headerHeight, onLayout])

  useEffect(() => {
    const el = document.getElementById('main-content')
    if (!el) return
    const fn = () => {
      scrollY.set(el.scrollTop)
    }
    fn()
    el.addEventListener('scroll', fn, { passive: true })
    return () => {
      el.removeEventListener('scroll', fn)
    }
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
          {images.length ? (
            <img
              src={pickImage(images, imgPx)?.url}
              srcSet={srcSetOf(images)}
              sizes={`${imgPx}px`}
              decoding="async"
              alt={name}
              className="w-full h-full object-cover rounded-full shadow-xl"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full rounded-full bg-black/10" />
          )}
        </motion.div>
      </div>

      {images.length > 0 && (
        <motion.img
          src={pickImage(images, 250)?.url}
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
        {link && (
          <DeezerAttribution
            href={link}
            label={t('common.openOnDeezer')}
            className="mt-2 pointer-events-auto"
          />
        )}
      </motion.div>
    </motion.div>
  )
}
