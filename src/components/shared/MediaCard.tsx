import { cn, pickImage, srcSetOf } from '@/lib/utils'
import type { Image } from '@/types/music'

const GRID_SIZES =
  '(min-width: 768px) 93px, (min-width: 640px) calc((100vw - 96px) / 5), calc((100vw - 72px) / 3)'

interface MediaCardProps {
  images?: Image[]
  title: string
  subtitle?: string
  onClick: () => void
  imageClassName?: string
  className?: string
  ariaLabel?: string
}

export function MediaCard({
  images,
  title,
  subtitle,
  onClick,
  imageClassName,
  className,
  ariaLabel,
}: MediaCardProps) {
  return (
    <div
      className={cn(
        'cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-black/40 group',
        className
      )}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      aria-label={ariaLabel ?? title}
    >
      <div className="relative aspect-square overflow-hidden rounded-[6px] shadow-lg group-hover:shadow-xl ring-1 ring-white/10 transition-all duration-200 group-hover:scale-105 group-active:scale-95">
        {images?.length ? (
          <img
            src={pickImage(images, 100)?.url}
            srcSet={srcSetOf(images)}
            sizes={GRID_SIZES}
            loading="lazy"
            decoding="async"
            alt={title}
            className={cn('w-full h-full object-cover', imageClassName)}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-black/20 flex items-center justify-center text-4xl text-white/20">
            ♪
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 px-2 pb-1.5">
          <p className="text-[9px] font-semibold text-white truncate leading-tight drop-shadow">
            {title}
          </p>
          {subtitle && (
            <p className="text-[8px] text-white/60 truncate leading-tight">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  )
}
