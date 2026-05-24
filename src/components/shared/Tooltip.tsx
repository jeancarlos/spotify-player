import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  align?: 'center' | 'start'
  maxWidth?: string
  className?: string
}

export function Tooltip({
  content,
  children,
  align = 'center',
  maxWidth,
  className,
}: TooltipProps) {
  const alignClass = align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0'
  const widthClass = maxWidth ? cn('whitespace-normal w-max', maxWidth) : 'whitespace-nowrap'

  return (
    <span className={cn('relative group/tooltip inline-block', className)}>
      {children}
      <span
        className={cn(
          'pointer-events-none absolute bottom-full mb-1 rounded-md bg-black/80 px-2 py-1',
          'text-xs text-white opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150 z-50',
          alignClass,
          widthClass
        )}
      >
        {content}
      </span>
    </span>
  )
}
