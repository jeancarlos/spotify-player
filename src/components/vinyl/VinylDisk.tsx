import { motion } from 'framer-motion'
import vinylWebp from '@/assets/vinyl.webp'

interface VinylDiskProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  albumArt?: string
  isPlaying?: boolean
  className?: string
}

const SIZE_MAP = { xs: 44, sm: 180, md: 360, lg: 560 } as const

export function VinylDisk({ size = 'md', albumArt, isPlaying = false, className }: VinylDiskProps) {
  const px = SIZE_MAP[size]
  const labelPx = Math.round(px * 0.27)

  return (
    <div
      className={`relative select-none shrink-0 ${className ?? ''}`}
      style={{ width: px, height: px }}
    >
      <motion.img
        src={vinylWebp}
        alt="vinyl disk"
        draggable={false}
        className="w-full h-full object-cover rounded-full"
        animate={{ rotate: isPlaying ? 360 : 0 }}
        transition={
          isPlaying
            ? { duration: 8, ease: 'linear', repeat: Infinity }
            : { duration: 1.2, ease: 'easeOut' }
        }
      />
      {albumArt && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="rounded-full overflow-hidden border-2 border-white/30"
            style={{ width: labelPx, height: labelPx }}
          >
            <img
              src={albumArt}
              alt="álbum"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  )
}
