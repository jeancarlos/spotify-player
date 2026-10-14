import { useEffect, useRef } from 'react'
import { useWindowSize } from '@/hooks/useWindowSize'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn, pickImage } from '@/lib/utils'
import type { Image } from '@/types/music'
import { DeezerAttribution } from './DeezerAttribution'
import { TiltCover } from './TiltCover'

interface ArtistLink {
  id: string
  name: string
}

interface CollectionHeaderProps {
  images: Image[]
  name: string
  subtitle: string
  artists?: ArtistLink[]
  year?: string
  playLabel: string
  onPlay: () => void
  onLayout: (height: number) => void
  onArtistClick?: (id: string) => void
  link?: string
}

function useCollectionLayout(hasLink: boolean) {
  const { width: vw } = useWindowSize()

  const imgPx = Math.min(280, Math.round(vw * 0.65))
  const translateY = Math.round(imgPx * 0.25)
  const headerHeight = imgPx - translateY + 184 + (hasLink ? 28 : 0)

  return { imgPx, headerHeight }
}

export function CollectionHeader({
  images,
  name,
  subtitle,
  artists,
  year,
  playLabel,
  onPlay,
  onLayout,
  onArtistClick,
  link,
}: CollectionHeaderProps) {
  const { t } = useTranslation()
  const { imgPx, headerHeight } = useCollectionLayout(!!link)

  const lastHeightRef = useRef<number>(0)
  useEffect(() => {
    if (headerHeight === lastHeightRef.current) return
    lastHeightRef.current = headerHeight
    onLayout(headerHeight)
  }, [headerHeight, onLayout])

  return (
    <div className="">
      <div
        className="absolute z-1 left-1/2"
        style={{ transform: 'translateX(-50%) translateY(-16px)', top: 0, zIndex: 2 }}
      >
        <motion.div
          initial={{ scale: 0.8, y: 60, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <TiltCover images={images} size={imgPx} name={name} onClick={onPlay}>
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center',
                'bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200'
              )}
            >
              <Play size={48} fill="white" color="white" className="drop-shadow-lg" />
            </div>
          </TiltCover>
        </motion.div>
      </div>

      {images.length > 0 && (
        <motion.img
          src={pickImage(images, 250)?.url}
          aria-hidden="true"
          alt={name}
          className="absolute left-0 right-0 top-[-300px] sepia-[.25] h-[600px] scale-2 opacity-10 w-full blur-3xl z-0"
          draggable={false}
          animate={{ opacity: 0.1 }}
          initial={{ opacity: 0, scale: 1 }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
        />
      )}

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
          {artists && onArtistClick ? (
            <>
              {artists.map((a, i) => (
                <span key={a.id}>
                  {i > 0 && ', '}
                  <button
                    onClick={() => {
                      onArtistClick(a.id)
                    }}
                    className="hover:text-black transition-colors underline underline-offset-2 decoration-black/20 hover:decoration-black/60"
                  >
                    {a.name}
                  </button>
                </span>
              ))}
            </>
          ) : (
            subtitle
          )}
          {year ? ` · ${year}` : ''}
        </p>
        {link && <DeezerAttribution href={link} label={t('common.openOnDeezer')} className="mt-2" />}
        <button
          onClick={onPlay}
          className={cn(
            'mt-4 px-8 py-3 bg-primary text-ink text-sm font-bold rounded-full',
            'hover:bg-primary/85 active:scale-95 transition-all shadow-lg'
          )}
        >
          {playLabel}
        </button>
      </motion.div>
    </div>
  )
}
