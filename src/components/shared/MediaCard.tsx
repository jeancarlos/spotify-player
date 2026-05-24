import { cn } from '@/lib/utils'

interface MediaCardProps {
  imageUrl?: string
  title: string
  subtitle?: string
  onClick: () => void
  onSecondaryAction?: () => void
  imageClassName?: string
  className?: string
  ariaLabel?: string
}

export function MediaCard({
  imageUrl,
  title,
  subtitle,
  onClick,
  imageClassName,
  className,
  ariaLabel,
}: MediaCardProps) {
  return (
    <div
      className={cn('cursor-pointer focus:outline-none group', className)}
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
        {imageUrl ? (
          <img
            src={imageUrl}
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
