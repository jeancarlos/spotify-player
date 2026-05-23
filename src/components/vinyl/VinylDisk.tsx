import { motion } from 'framer-motion'
import vinylWebp from '@/assets/vinyl.webp'

interface VinylDiskProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  albumArt?: string
  isPlaying?: boolean
  className?: string
}

const SIZE_MAP = { xs: 44, sm: 180, md: 360, lg: 560, xl: 720 } as const

export function VinylDisk({ size = 'md', albumArt, isPlaying = false, className }: VinylDiskProps) {
  const px = SIZE_MAP[size]
  const labelPx = Math.round(px * 0.27)
  const labelCenterPx = Math.round(labelPx * 0.1)

  const transition = isPlaying
    ? { duration: 8, ease: 'linear', repeat: Infinity }
    : { duration: 1.2, ease: 'easeOut' }

  const animation = {
    rotate: isPlaying ? 360 : 0,
  }

  return (
    <div
      className={`relative select-none shrink-0 ${className ?? ''}`}
      style={{ width: px, height: px, }}
    >
      <motion.img
        src={vinylWebp}
        alt="vinyl disk"
        draggable={false}
        className="w-full h-full object-cover rounded-full"
        animate={animation}
        transition={transition}
      />
      {albumArt && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="rounded-full overflow-hidden border-0 border-white/30"
            style={{ width: labelPx, height: labelPx }}
          >
            <motion.img
              src={albumArt}
              alt="álbum"
              className="w-full h-full object-cover"
              animate={animation}
              transition={transition}

            />
            <div
              className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2"
              style={{ width: labelCenterPx, height: labelCenterPx }}
            >
              <div className="w-full h-full bg-white/20 backdrop-blur-sm rounded-full border-black/20" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
